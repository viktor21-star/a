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
            Status = "активен"
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

    public BakingPlanCardDto Update(long planHeaderId, UpdateManualPlanRequest request, string locationName)
    {
        using var connection = localAppDb.CreateConnection();
        connection.Open();

        var existing = connection.QueryFirstOrDefault<ManualPlanRow>(
            """
            SELECT PlanHeaderId, PlanDate, LocationId, LocationName, ShiftName, TermLabel, ItemName, SuggestedQty, CorrectedQty, Mode, Status
            FROM ManualPlans
            WHERE PlanHeaderId = @PlanHeaderId
            """,
            new { PlanHeaderId = planHeaderId });

        if (existing is null)
        {
            throw new InvalidOperationException("Планот не е пронајден.");
        }

        var shiftName = existing.Mode == "pecenjara" ? "Печењара" : "Пекара";
        var itemName = existing.Mode == "pecenjara" ? "Печењара" : "Пекара";

        connection.Execute(
            """
            UPDATE ManualPlans
            SET LocationId = @LocationId,
                LocationName = @LocationName,
                ShiftName = @ShiftName,
                TermLabel = @TermLabel,
                ItemName = @ItemName,
                CorrectedQty = @CorrectedQty
            WHERE PlanHeaderId = @PlanHeaderId
            """,
            new
            {
                PlanHeaderId = planHeaderId,
                request.LocationId,
                LocationName = locationName,
                ShiftName = shiftName,
                TermLabel = request.PlannedTime,
                ItemName = itemName,
                CorrectedQty = request.PlannedQty
            });

        return new BakingPlanCardDto(
            existing.PlanHeaderId,
            DateOnly.Parse(existing.PlanDate),
            request.LocationId,
            locationName,
            shiftName,
            request.PlannedTime,
            itemName,
            existing.SuggestedQty,
            request.PlannedQty,
            existing.Mode,
            existing.Status);
    }

    public void Delete(long planHeaderId)
    {
        using var connection = localAppDb.CreateConnection();
        connection.Open();

        var affected = connection.Execute(
            """
            DELETE FROM ManualPlans
            WHERE PlanHeaderId = @PlanHeaderId
            """,
            new { PlanHeaderId = planHeaderId });

        if (affected == 0)
        {
            throw new InvalidOperationException("Планот не е пронајден.");
        }
    }

    public BakingPlanCardDto UpdateStatus(long planHeaderId, string status)
    {
        using var connection = localAppDb.CreateConnection();
        connection.Open();

        var existing = connection.QueryFirstOrDefault<ManualPlanRow>(
            """
            SELECT PlanHeaderId, PlanDate, LocationId, LocationName, ShiftName, TermLabel, ItemName, SuggestedQty, CorrectedQty, Mode, Status
            FROM ManualPlans
            WHERE PlanHeaderId = @PlanHeaderId
            """,
            new { PlanHeaderId = planHeaderId });

        if (existing is null)
        {
            throw new InvalidOperationException("Планот не е пронајден.");
        }

        connection.Execute(
            """
            UPDATE ManualPlans
            SET Status = @Status
            WHERE PlanHeaderId = @PlanHeaderId
            """,
            new
            {
                PlanHeaderId = planHeaderId,
                Status = status
            });

        return new BakingPlanCardDto(
            existing.PlanHeaderId,
            DateOnly.Parse(existing.PlanDate),
            existing.LocationId,
            existing.LocationName,
            existing.ShiftName,
            existing.TermLabel,
            existing.ItemName,
            existing.SuggestedQty,
            existing.CorrectedQty,
            existing.Mode,
            status);
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

    private sealed class ManualPlanRow
    {
        public long PlanHeaderId { get; init; }
        public string PlanDate { get; init; } = string.Empty;
        public int LocationId { get; init; }
        public string LocationName { get; init; } = string.Empty;
        public string ShiftName { get; init; } = string.Empty;
        public string TermLabel { get; init; } = string.Empty;
        public string ItemName { get; init; } = string.Empty;
        public decimal SuggestedQty { get; init; }
        public decimal CorrectedQty { get; init; }
        public string Mode { get; init; } = string.Empty;
        public string Status { get; init; } = string.Empty;
    }
}
