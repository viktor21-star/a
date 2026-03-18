using Pecenje.Api.Configuration;
using Pecenje.Api.Endpoints;
using Pecenje.Api.Extensions;
using Pecenje.Api.Services;

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
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseExceptionHandler();
app.UseHttpsRedirection();
app.UseStaticFiles();
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
app.MapIntegrationEndpoints();
app.MapUserAccessEndpoints();
app.MapVersionEndpoints();

app.Run();
