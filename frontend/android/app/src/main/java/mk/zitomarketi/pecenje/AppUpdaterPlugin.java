package mk.zitomarketi.pecenje;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "AppUpdater")
public class AppUpdaterPlugin extends Plugin {
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void startUpdate(PluginCall call) {
        String url = call.getString("url");
        String fileName = call.getString("fileName", "app-update.apk");

        if (url == null || url.isBlank()) {
            call.reject("Download URL is required.");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            && !getContext().getPackageManager().canRequestPackageInstalls()) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.reject("Allow install unknown apps for this application and retry.");
            return;
        }

        executor.execute(() -> {
            HttpURLConnection connection = null;

            try {
                URL downloadUrl = new URL(url);
                connection = (HttpURLConnection) downloadUrl.openConnection();
                connection.setRequestMethod("GET");
                connection.connect();

                if (connection.getResponseCode() >= 400) {
                    call.reject("APK download failed with status " + connection.getResponseCode());
                    return;
                }

                File updatesDirectory = new File(getContext().getCacheDir(), "updates");
                if (!updatesDirectory.exists() && !updatesDirectory.mkdirs()) {
                    call.reject("Cannot create update directory.");
                    return;
                }

                File targetFile = new File(updatesDirectory, fileName);

                try (InputStream inputStream = connection.getInputStream();
                     FileOutputStream outputStream = new FileOutputStream(targetFile)) {
                    byte[] buffer = new byte[8192];
                    int read;

                    while ((read = inputStream.read(buffer)) != -1) {
                        outputStream.write(buffer, 0, read);
                    }
                }

                Uri apkUri = FileProvider.getUriForFile(
                    getContext(),
                    getContext().getPackageName() + ".fileprovider",
                    targetFile
                );

                Intent installIntent = new Intent(Intent.ACTION_VIEW);
                installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                getContext().startActivity(installIntent);

                JSObject result = new JSObject();
                result.put("filePath", targetFile.getAbsolutePath());
                result.put("openedInstaller", true);
                call.resolve(result);
            } catch (Exception exception) {
                call.reject("Update failed: " + exception.getMessage(), exception);
            } finally {
                if (connection != null) {
                    connection.disconnect();
                }
            }
        });
    }
}
