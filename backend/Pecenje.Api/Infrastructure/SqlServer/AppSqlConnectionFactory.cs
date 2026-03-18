using System.Data;
using Microsoft.Data.SqlClient;

namespace Pecenje.Api.Infrastructure.SqlServer;

public sealed class AppSqlConnectionFactory(IConfiguration configuration) : IAppSqlConnectionFactory
{
    public IDbConnection CreateConnection()
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("Missing ConnectionStrings:DefaultConnection.");
        }

        return new SqlConnection(connectionString);
    }
}
