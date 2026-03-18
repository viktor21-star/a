using System.Data;

namespace Pecenje.Api.Infrastructure.SqlServer;

public interface IAppSqlConnectionFactory
{
    IDbConnection CreateConnection();
}
