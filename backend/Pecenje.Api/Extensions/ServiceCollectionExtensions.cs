using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Application.Services;
using Pecenje.Api.Infrastructure.Demo;
using Pecenje.Api.Infrastructure.Sqlite;
using Pecenje.Api.Infrastructure.SqlServer;
using Pecenje.Api.Infrastructure.UserAccess;
using Pecenje.Api.Infrastructure.Web;
using Pecenje.Api.Services;

namespace Pecenje.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddSingleton<LocalAppDb>();
        services.AddSingleton<DemoDataService>();
        services.AddSingleton<InMemoryManualPlanningStore>();
        services.AddSingleton<InMemoryOperatorEntryStore>();
        services.AddSingleton<InMemoryWasteStore>();
        services.AddSingleton<InMemoryLocationOvenStore>();
        services.AddSingleton<InMemoryTermStore>();
        services.AddSingleton<InMemoryReasonStore>();
        services.AddScoped<DemoUserAccessRepository>();
        services.AddScoped<SqliteUserAccessRepository>();
        services.AddScoped<SqliteLocationRepository>();
        services.AddScoped<DemoMasterDataRepository>();
        services.AddScoped<SqlServerMasterDataRepository>();
        services.AddScoped<IAuthService, DemoAuthService>();
        services.AddScoped<IAuditService, DemoAuditService>();
        services.AddScoped<ICurrentUserProvider, HttpCurrentUserProvider>();
        services.AddScoped<IAppSqlConnectionFactory, AppSqlConnectionFactory>();
        services.AddScoped<ISourceSqlConnectionFactory, SourceSqlConnectionFactory>();
        services.AddScoped<IAuditLogRepository, SqlServerAuditLogRepository>();
        services.AddScoped<IMasterDataSyncRunRepository, SqlServerMasterDataSyncRunRepository>();
        services.AddScoped<IPlanningRepository, DemoPlanningRepository>();
        services.AddScoped<IProductionRepository, DemoProductionRepository>();
        services.AddScoped<IAnalyticsRepository, DemoAnalyticsRepository>();
        services.AddScoped<IMasterDataRepository, HybridMasterDataRepository>();
        services.AddScoped<ISourceMasterDataReader, SqlServerSourceMasterDataReader>();
        services.AddScoped<IUserAccessRepository, HybridUserAccessRepository>();
        services.AddScoped<DashboardAppService>();
        services.AddScoped<PlanningAppService>();
        services.AddScoped<ProductionAppService>();
        services.AddScoped<ReportingAppService>();
        services.AddScoped<MasterDataAppService>();
        services.AddScoped<MasterDataSyncAppService>();
        services.AddScoped<AdminAccessAppService>();
        services.AddScoped<LocationAccessAppService>();
        services.AddScoped<UserAccessAppService>();
        services.AddScoped<OvenConfigAppService>();
        services.AddScoped<TermAppService>();
        services.AddScoped<ReasonAppService>();
        services.AddSingleton<AppVersioningService>();
        return services;
    }
}
