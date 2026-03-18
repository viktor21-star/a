using Microsoft.Extensions.Options;
using Pecenje.Api.Application.Services;
using Pecenje.Api.Configuration;

namespace Pecenje.Api.Services;

public sealed class MasterDataSyncBackgroundService(
    IServiceScopeFactory scopeFactory,
    IOptions<MasterDataSyncOptions> options,
    ILogger<MasterDataSyncBackgroundService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var settings = options.Value;
        if (!settings.Enabled)
        {
            logger.LogInformation("Master data sync background service is disabled.");
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            var delay = GetDelayUntilNextRun(settings.DailyTime);
            logger.LogInformation("Next master data sync is scheduled in {Delay}.", delay);

            await Task.Delay(delay, stoppingToken);

            try
            {
                using var scope = scopeFactory.CreateScope();
                var syncService = scope.ServiceProvider.GetRequiredService<MasterDataSyncAppService>();

                var locations = await syncService.SyncLocationsAsync(stoppingToken);
                var items = await syncService.SyncItemsAsync(stoppingToken);

                logger.LogInformation("Master data sync finished. Locations: {Locations}, Items: {Items}", locations, items);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Master data sync failed.");
            }
        }
    }

    private static TimeSpan GetDelayUntilNextRun(string dailyTime)
    {
        var now = DateTime.Now;
        if (!TimeOnly.TryParse(dailyTime, out var time))
        {
            time = new TimeOnly(2, 0);
        }

        var nextRun = now.Date.Add(time.ToTimeSpan());
        if (nextRun <= now)
        {
            nextRun = nextRun.AddDays(1);
        }

        return nextRun - now;
    }
}
