using Pecenje.Api.Contracts.Sync;

namespace Pecenje.Api.Application.Abstractions;

public interface ISourceMasterDataReader
{
    Task<IReadOnlyList<SourceLocationDto>> ReadLocationsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SourceItemDto>> ReadItemsAsync(CancellationToken cancellationToken = default);
}
