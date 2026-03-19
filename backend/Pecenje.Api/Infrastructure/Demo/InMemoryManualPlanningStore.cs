using Pecenje.Api.Contracts.Planning;

namespace Pecenje.Api.Infrastructure.Demo;

public sealed class InMemoryManualPlanningStore
{
    private readonly List<BakingPlanCardDto> plans = [];
    private long nextId = 9000;
    private readonly object gate = new();

    public IReadOnlyList<BakingPlanCardDto> GetAll()
    {
        lock (gate)
        {
            return plans.OrderBy((entry) => entry.TermLabel).ToArray();
        }
    }

    public BakingPlanCardDto Add(CreateManualPlanRequest request, string locationName)
    {
        lock (gate)
        {
            nextId += 1;
            var card = new BakingPlanCardDto(
                nextId,
                DateOnly.FromDateTime(DateTime.Today),
                request.LocationId,
                locationName,
                request.Mode == "pecenjara" ? "Печењара" : "Пекара",
                request.PlannedTime,
                request.Mode == "pecenjara" ? "Печењара" : "Пекара",
                0,
                request.PlannedQty,
                request.Mode,
                "рачно");
            plans.Insert(0, card);
            return card;
        }
    }
}
