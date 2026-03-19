using Pecenje.Api.Contracts.Planning;
using Pecenje.Api.Infrastructure.Sqlite;
using Dapper;

namespace Pecenje.Api.Infrastructure.Demo;

public sealed class InMemoryManualPlanningStore(LocalAppDb localAppDb)
{
    public IReadOnlyList<BakingPlanCardDto> GetAll()
    {
        using var connection = localAppDb.CreateConnection();
        connection.Open();
        return connection.Query<ManualPlanRow>(
            """
            SELECT PlanHeaderId, PlanDate, LocationId, LocationName, ShiftName, TermLabel, ItemName, SuggestedQty, CorrectedQty, Mode, Status
            FROM ManualPlans
            ORDER BY TermLabel, PlanHeaderId DESC
            """)
            .Select(Map)
            .ToArray();
    }

    public BakingPlanCardDto Add(CreateManualPlanRequest request, string locationName)
    {
        using var connection = localAppDb.CreateConnection();
        connection.Open();

        var row = new
        {
            PlanDate = DateOnly.FromDateTime(DateTime.Today).ToString("yyyy-MM-dd"),
            request.LocationId,
            LocationName = locationName,
            ShiftName = request.Mode == "pecenjara" ? "Печењара" : "Пекара",
            TermLabel = request.PlannedTime,
            ItemName = request.Mode == "pecenjara" ? "Печењара" : "Пекара",
            SuggestedQty = 0m,
            CorrectedQty = request.PlannedQty,
            request.Mode,
            Status = "рачно"
        };

        var planHeaderId = connection.ExecuteScalar<long>(
            """
            INSERT INTO ManualPlans (
                PlanDate, LocationId, LocationName, ShiftName, TermLabel, ItemName, SuggestedQty, CorrectedQty, Mode, Status
            ) VALUES (
                @PlanDate, @LocationId, @LocationName, @ShiftName, @TermLabel, @ItemName, @SuggestedQty, @CorrectedQty, @Mode, @Status
            );
            SELECT last_insert_rowid();
            """,
            row);

        return new BakingPlanCardDto(
            planHeaderId,
            DateOnly.Parse(row.PlanDate),
            row.LocationId,
            row.LocationName,
            row.ShiftName,
            row.TermLabel,
            row.ItemName,
            row.SuggestedQty,
            row.CorrectedQty,
            row.Mode,
            row.Status);
    }

    private static BakingPlanCardDto Map(ManualPlanRow row)
        => new(
            row.PlanHeaderId,
            DateOnly.Parse(row.PlanDate),
            row.LocationId,
            row.LocationName,
            row.ShiftName,
            row.TermLabel,
            row.ItemName,
            row.SuggestedQty,
            row.CorrectedQty,
            row.Mode,
            row.Status);

    private sealed record ManualPlanRow(
        long PlanHeaderId,
        string PlanDate,
        int LocationId,
        string LocationName,
        string ShiftName,
        string TermLabel,
        string ItemName,
        decimal SuggestedQty,
        decimal CorrectedQty,
        string Mode,
        string Status);
}
