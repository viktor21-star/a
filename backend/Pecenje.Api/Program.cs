using Pecenje.Api.Configuration;
using Pecenje.Api.Endpoints;
using Pecenje.Api.Extensions;
using Pecenje.Api.Services;
using Microsoft.Extensions.FileProviders;
using Microsoft.AspNetCore.StaticFiles;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddProblemDetails();
builder.Services.Configure<SourceDatabaseOptions>(builder.Configuration.GetSection(SourceDatabaseOptions.SectionName));
builder.Services.Configure<MasterDataSyncOptions>(builder.Configuration.GetSection(MasterDataSyncOptions.SectionName));
builder.Services.Configure<AppVersioningOptions>(builder.Configuration.GetSection(AppVersioningOptions.SectionName));
builder.Services.AddApplicationServices();
builder.Services.AddHostedService<MasterDataSyncBackgroundService>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

var staticFileContentTypeProvider = new FileExtensionContentTypeProvider();
staticFileContentTypeProvider.Mappings[".apk"] = "application/vnd.android.package-archive";
var frontendDistPath = Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, "..", "..", "frontend", "dist"));
var frontendDistExists = Directory.Exists(frontendDistPath);

app.UseExceptionHandler();
app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = staticFileContentTypeProvider
});
if (frontendDistExists)
{
    app.UseDefaultFiles(new DefaultFilesOptions
    {
        FileProvider = new PhysicalFileProvider(frontendDistPath),
        RequestPath = ""
    });
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(frontendDistPath),
        ContentTypeProvider = staticFileContentTypeProvider
    });
}
app.UseCors("frontend");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    service = "Pecenje.Api",
    timestamp = DateTimeOffset.UtcNow
}));

app.MapAuthEndpoints();
app.MapDashboardEndpoints();
app.MapPlanningEndpoints();
app.MapBatchEndpoints();
app.MapWasteEndpoints();
app.MapAlertEndpoints();
app.MapReportEndpoints();
app.MapMasterDataEndpoints();
app.MapOvenEndpoints();
app.MapTermEndpoints();
app.MapReasonEndpoints();
app.MapIntegrationEndpoints();
app.MapUserAccessEndpoints();
app.MapVersionEndpoints();

if (frontendDistExists)
{
    app.MapFallback(async context =>
    {
        var requestPath = context.Request.Path.Value ?? string.Empty;
        if (requestPath.StartsWith("/api/", StringComparison.OrdinalIgnoreCase) ||
            requestPath.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase) ||
            requestPath.StartsWith("/health", StringComparison.OrdinalIgnoreCase) ||
            requestPath.StartsWith("/downloads", StringComparison.OrdinalIgnoreCase))
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return;
        }

        await context.Response.SendFileAsync(Path.Combine(frontendDistPath, "index.html"));
    });
}

app.Run();
