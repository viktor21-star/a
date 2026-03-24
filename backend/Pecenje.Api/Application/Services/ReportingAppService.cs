using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Contracts.Reports;
using System.Text;

namespace Pecenje.Api.Application.Services;

public sealed class ReportingAppService(IAnalyticsRepository analyticsRepository)
{
    public async Task<PlanVsActualReportDto> GetPlanVsActualAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await analyticsRepository.GetPlanVsActualAsync(cancellationToken);
        }
        catch
        {
            return new PlanVsActualReportDto([], new ReportTotalsDto(0, 0, 0, 0));
        }
    }

    public async Task<ReportExportDto> ExportPlanVsActualExcelAsync(CancellationToken cancellationToken = default)
    {
        var report = await GetPlanVsActualAsync(cancellationToken);
        var builder = new StringBuilder();

        builder.AppendLine("Локација,Артикал,Модул,Датум,Планирано време,Реално време,Доцнење (мин),Статус,Планирано,Испечено,Разлика,% Реализација");

        foreach (var row in report.Rows)
        {
            builder.AppendLine($"{Escape(row.LocationName)},{Escape(row.ItemName)},{Escape(row.Mode)},{Escape(row.PlanDate)},{Escape(row.PlannedTime)},{Escape(row.ActualTime ?? "-")},{row.DelayMinutes?.ToString() ?? "-"},{Escape(row.TimingStatus)},{row.PlannedQty},{row.BakedQty},{row.DifferenceQty},{row.RealizationPct}");
        }

        builder.AppendLine($"{Escape("Вкупно")},,,,,,,,{report.Totals.PlannedQty},{report.Totals.BakedQty},{report.Totals.DifferenceQty},{report.Totals.RealizationPct}");

        return new ReportExportDto(
            "plan-vs-actual.csv",
            "text/csv; charset=utf-8",
            Convert.ToBase64String(Encoding.UTF8.GetBytes(builder.ToString()))
        );
    }

    public async Task<ReportExportDto> ExportPlanVsActualPdfAsync(CancellationToken cancellationToken = default)
    {
        var report = await GetPlanVsActualAsync(cancellationToken);
        var builder = new StringBuilder();

        builder.Append("""
            <html>
            <head>
              <meta charset="utf-8" />
              <title>План vs реализација</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 24px; color: #163f31; }
                h1 { margin-bottom: 16px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #cfe0d6; padding: 10px; text-align: left; }
                th { background: #edf4ef; }
                tfoot td { font-weight: bold; }
              </style>
            </head>
            <body>
              <h1>План vs реализација</h1>
              <table>
                <thead>
                  <tr>
                    <th>Локација</th>
                    <th>Артикал</th>
                    <th>Модул</th>
                    <th>Датум</th>
                    <th>Планирано време</th>
                    <th>Реално време</th>
                    <th>Доцнење (мин)</th>
                    <th>Статус</th>
                    <th>Планирано</th>
                    <th>Испечено</th>
                    <th>Разлика</th>
                    <th>% Реализација</th>
                  </tr>
                </thead>
                <tbody>
            """);

        foreach (var row in report.Rows)
        {
            builder.Append($"""
                <tr>
                  <td>{System.Net.WebUtility.HtmlEncode(row.LocationName)}</td>
                  <td>{System.Net.WebUtility.HtmlEncode(row.ItemName)}</td>
                  <td>{System.Net.WebUtility.HtmlEncode(row.Mode)}</td>
                  <td>{System.Net.WebUtility.HtmlEncode(row.PlanDate)}</td>
                  <td>{System.Net.WebUtility.HtmlEncode(row.PlannedTime)}</td>
                  <td>{System.Net.WebUtility.HtmlEncode(row.ActualTime ?? "-")}</td>
                  <td>{row.DelayMinutes?.ToString() ?? "-"}</td>
                  <td>{System.Net.WebUtility.HtmlEncode(row.TimingStatus)}</td>
                  <td>{row.PlannedQty}</td>
                  <td>{row.BakedQty}</td>
                  <td>{row.DifferenceQty}</td>
                  <td>{row.RealizationPct}%</td>
                </tr>
                """);
        }

        builder.Append($"""
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="8">Вкупно</td>
                    <td>{report.Totals.PlannedQty}</td>
                    <td>{report.Totals.BakedQty}</td>
                    <td>{report.Totals.DifferenceQty}</td>
                    <td>{report.Totals.RealizationPct}%</td>
                  </tr>
                </tfoot>
              </table>
            </body>
            </html>
            """);

        return new ReportExportDto(
            "plan-vs-actual.html",
            "text/html; charset=utf-8",
            Convert.ToBase64String(Encoding.UTF8.GetBytes(builder.ToString()))
        );
    }

    private static string Escape(string value)
    {
        return $"\"{value.Replace("\"", "\"\"")}\"";
    }
}
