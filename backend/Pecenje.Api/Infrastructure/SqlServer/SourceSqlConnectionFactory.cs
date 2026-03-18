using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;
using Pecenje.Api.Configuration;

namespace Pecenje.Api.Infrastructure.SqlServer;

public sealed class SourceSqlConnectionFactory(IOptions<SourceDatabaseOptions> options) : ISourceSqlConnectionFactory
{
    public IDbConnection CreateConnection()
    {
        var source = options.Value;
        if (string.IsNullOrWhiteSpace(source.Server) ||
            string.IsNullOrWhiteSpace(source.Database) ||
            string.IsNullOrWhiteSpace(source.Username) ||
            string.IsNullOrWhiteSpace(source.Password))
        {
            throw new InvalidOperationException("SourceDatabase configuration is incomplete.");
        }

        var builder = new SqlConnectionStringBuilder
        {
            DataSource = $"{source.Server},{source.Port}",
            InitialCatalog = source.Database,
            UserID = source.Username,
            Password = source.Password,
            TrustServerCertificate = true,
            Encrypt = false
        };

        return new SqlConnection(builder.ConnectionString);
    }
}
