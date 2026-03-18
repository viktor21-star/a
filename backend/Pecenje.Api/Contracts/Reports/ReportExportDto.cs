namespace Pecenje.Api.Contracts.Reports;

public sealed record ReportExportDto(
    string FileName,
    string ContentType,
    string ContentBase64
);
