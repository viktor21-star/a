using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Contracts.Planning;
using Pecenje.Api.Services;

namespace Pecenje.Api.Infrastructure.Demo;

public sealed class DemoPlanningRepository(DemoDataService demoDataService) : IPlanningRepository
{
    public Task<IReadOnlyList<BakingPlanCardDto>> GetDailyPlansAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(demoDataService.GetPlans());
    }
}
