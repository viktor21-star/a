using System.Data;

namespace Pecenje.Api.Infrastructure.SqlServer;

public interface ISourceSqlConnectionFactory
{
    IDbConnection CreateConnection();
}
