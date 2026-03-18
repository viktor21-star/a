CREATE TABLE dbo.Roles (
    RoleId INT IDENTITY PRIMARY KEY,
    Code NVARCHAR(50) NOT NULL UNIQUE,
    NameMk NVARCHAR(100) NOT NULL
);
GO

CREATE TABLE dbo.Locations (
    LocationId INT IDENTITY PRIMARY KEY,
    Code NVARCHAR(50) NOT NULL UNIQUE,
    NameMk NVARCHAR(200) NOT NULL,
    RegionCode NVARCHAR(50) NOT NULL,
    SourceSystem NVARCHAR(100) NOT NULL DEFAULT N'ExternalRetailDb',
    SourceLocationId NVARCHAR(100) NULL,
    LastSyncedAt DATETIME2 NULL,
    SyncBatchId BIGINT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

CREATE TABLE dbo.Shifts (
    ShiftId INT IDENTITY PRIMARY KEY,
    Code NVARCHAR(50) NOT NULL UNIQUE,
    NameMk NVARCHAR(100) NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL
);
GO

CREATE TABLE dbo.BakingTerms (
    TermId INT IDENTITY PRIMARY KEY,
    Code NVARCHAR(50) NOT NULL UNIQUE,
    NameMk NVARCHAR(100) NOT NULL,
    PlannedTime TIME NOT NULL,
    AllowedStartDelayMinutes INT NOT NULL DEFAULT 10
);
GO

CREATE TABLE dbo.Ovens (
    OvenId INT IDENTITY PRIMARY KEY,
    LocationId INT NOT NULL FOREIGN KEY REFERENCES dbo.Locations(LocationId),
    Code NVARCHAR(50) NOT NULL,
    NameMk NVARCHAR(100) NOT NULL,
    CapacityUnits DECIMAL(18,2) NULL,
    IsActive BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE dbo.ItemGroups (
    ItemGroupId INT IDENTITY PRIMARY KEY,
    Code NVARCHAR(50) NOT NULL UNIQUE,
    NameMk NVARCHAR(100) NOT NULL
);
GO

CREATE TABLE dbo.Items (
    ItemId INT IDENTITY PRIMARY KEY,
    Code NVARCHAR(50) NOT NULL UNIQUE,
    NameMk NVARCHAR(200) NOT NULL,
    ItemGroupId INT NOT NULL FOREIGN KEY REFERENCES dbo.ItemGroups(ItemGroupId),
    SourceSystem NVARCHAR(100) NOT NULL DEFAULT N'ExternalRetailDb',
    SourceItemId NVARCHAR(100) NULL,
    LastSyncedAt DATETIME2 NULL,
    SyncBatchId BIGINT NULL,
    UnitCode NVARCHAR(20) NOT NULL DEFAULT N'парче',
    StandardCost DECIMAL(18,2) NOT NULL DEFAULT 0,
    SalesPrice DECIMAL(18,2) NOT NULL DEFAULT 0,
    WasteLimitPct DECIMAL(9,2) NOT NULL DEFAULT 5,
    IsActive BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE dbo.Users (
    UserId BIGINT IDENTITY PRIMARY KEY,
    Username NVARCHAR(100) NOT NULL UNIQUE,
    FullName NVARCHAR(200) NOT NULL,
    PasswordHash NVARCHAR(500) NOT NULL,
    RoleId INT NOT NULL FOREIGN KEY REFERENCES dbo.Roles(RoleId),
    DefaultLocationId INT NULL FOREIGN KEY REFERENCES dbo.Locations(LocationId),
    IsActive BIT NOT NULL DEFAULT 1,
    LastLoginAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

CREATE TABLE dbo.UserLocations (
    UserId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserId),
    LocationId INT NOT NULL FOREIGN KEY REFERENCES dbo.Locations(LocationId),
    CanPlan BIT NOT NULL DEFAULT 0,
    CanBake BIT NOT NULL DEFAULT 0,
    CanRecordWaste BIT NOT NULL DEFAULT 0,
    CanViewReports BIT NOT NULL DEFAULT 0,
    CanApprovePlan BIT NOT NULL DEFAULT 0,
    PRIMARY KEY (UserId, LocationId)
);
GO

CREATE TABLE dbo.MasterDataSyncRuns (
    SyncRunId BIGINT IDENTITY PRIMARY KEY,
    SyncType NVARCHAR(50) NOT NULL,
    SourceSystem NVARCHAR(100) NOT NULL,
    StartedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    FinishedAt DATETIME2 NULL,
    StatusCode NVARCHAR(30) NOT NULL,
    ReadCount INT NOT NULL DEFAULT 0,
    InsertedCount INT NOT NULL DEFAULT 0,
    UpdatedCount INT NOT NULL DEFAULT 0,
    DeactivatedCount INT NOT NULL DEFAULT 0,
    ErrorMessage NVARCHAR(2000) NULL
);
GO

CREATE TABLE dbo.WasteReasons (
    WasteReasonId INT IDENTITY PRIMARY KEY,
    Code NVARCHAR(50) NOT NULL UNIQUE,
    NameMk NVARCHAR(100) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE dbo.CorrectionReasons (
    CorrectionReasonId INT IDENTITY PRIMARY KEY,
    Code NVARCHAR(50) NOT NULL UNIQUE,
    NameMk NVARCHAR(100) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE dbo.AlertRules (
    AlertRuleId INT IDENTITY PRIMARY KEY,
    Code NVARCHAR(100) NOT NULL UNIQUE,
    NameMk NVARCHAR(200) NOT NULL,
    ThresholdValue DECIMAL(18,4) NOT NULL,
    UnitCode NVARCHAR(20) NOT NULL,
    Severity NVARCHAR(20) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE dbo.BakingPlanHeaders (
    PlanHeaderId BIGINT IDENTITY PRIMARY KEY,
    PlanDate DATE NOT NULL,
    LocationId INT NOT NULL FOREIGN KEY REFERENCES dbo.Locations(LocationId),
    ShiftId INT NOT NULL FOREIGN KEY REFERENCES dbo.Shifts(ShiftId),
    StatusCode NVARCHAR(30) NOT NULL,
    GeneratedAt DATETIME2 NULL,
    GeneratedByUserId BIGINT NULL FOREIGN KEY REFERENCES dbo.Users(UserId),
    ApprovedAt DATETIME2 NULL,
    ApprovedByUserId BIGINT NULL FOREIGN KEY REFERENCES dbo.Users(UserId),
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UNIQUE (PlanDate, LocationId, ShiftId)
);
GO

CREATE TABLE dbo.BakingPlanLines (
    PlanLineId BIGINT IDENTITY PRIMARY KEY,
    PlanHeaderId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.BakingPlanHeaders(PlanHeaderId),
    TermId INT NOT NULL FOREIGN KEY REFERENCES dbo.BakingTerms(TermId),
    ItemId INT NOT NULL FOREIGN KEY REFERENCES dbo.Items(ItemId),
    SuggestedQty DECIMAL(18,2) NOT NULL DEFAULT 0,
    PlannedQty DECIMAL(18,2) NOT NULL DEFAULT 0,
    CorrectedQty DECIMAL(18,2) NOT NULL DEFAULT 0,
    StatusCode NVARCHAR(30) NOT NULL,
    CorrectionReasonId INT NULL FOREIGN KEY REFERENCES dbo.CorrectionReasons(CorrectionReasonId),
    CorrectionNote NVARCHAR(500) NULL,
    UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    RowVersion ROWVERSION
);
GO

CREATE TABLE dbo.BakingBatches (
    BatchId BIGINT IDENTITY PRIMARY KEY,
    PlanLineId BIGINT NULL FOREIGN KEY REFERENCES dbo.BakingPlanLines(PlanLineId),
    LocationId INT NOT NULL FOREIGN KEY REFERENCES dbo.Locations(LocationId),
    ShiftId INT NOT NULL FOREIGN KEY REFERENCES dbo.Shifts(ShiftId),
    TermId INT NOT NULL FOREIGN KEY REFERENCES dbo.BakingTerms(TermId),
    ItemId INT NOT NULL FOREIGN KEY REFERENCES dbo.Items(ItemId),
    OvenId INT NULL FOREIGN KEY REFERENCES dbo.Ovens(OvenId),
    BatchNumber NVARCHAR(100) NOT NULL,
    ActualQty DECIMAL(18,2) NOT NULL,
    StartTime DATETIME2 NOT NULL,
    EndTime DATETIME2 NULL,
    StatusCode NVARCHAR(30) NOT NULL,
    OperatorUserId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserId),
    Note NVARCHAR(500) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

CREATE TABLE dbo.WasteEntries (
    WasteEntryId BIGINT IDENTITY PRIMARY KEY,
    BatchId BIGINT NULL FOREIGN KEY REFERENCES dbo.BakingBatches(BatchId),
    LocationId INT NOT NULL FOREIGN KEY REFERENCES dbo.Locations(LocationId),
    ShiftId INT NOT NULL FOREIGN KEY REFERENCES dbo.Shifts(ShiftId),
    ItemId INT NOT NULL FOREIGN KEY REFERENCES dbo.Items(ItemId),
    WasteReasonId INT NOT NULL FOREIGN KEY REFERENCES dbo.WasteReasons(WasteReasonId),
    Quantity DECIMAL(18,2) NOT NULL,
    RecordedAt DATETIME2 NOT NULL,
    OperatorUserId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserId),
    Note NVARCHAR(500) NULL
);
GO

CREATE TABLE dbo.PosSalesImports (
    ImportId BIGINT IDENTITY PRIMARY KEY,
    SourceSystem NVARCHAR(100) NOT NULL,
    ImportedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    BusinessDate DATE NOT NULL,
    StatusCode NVARCHAR(30) NOT NULL,
    Message NVARCHAR(1000) NULL
);
GO

CREATE TABLE dbo.PosSalesLines (
    SalesLineId BIGINT IDENTITY PRIMARY KEY,
    ImportId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.PosSalesImports(ImportId),
    LocationId INT NOT NULL FOREIGN KEY REFERENCES dbo.Locations(LocationId),
    ItemId INT NOT NULL FOREIGN KEY REFERENCES dbo.Items(ItemId),
    BusinessDate DATE NOT NULL,
    BusinessHour TINYINT NULL,
    SoldQty DECIMAL(18,2) NOT NULL,
    NetAmount DECIMAL(18,2) NOT NULL DEFAULT 0
);
GO

CREATE TABLE dbo.Alerts (
    AlertId BIGINT IDENTITY PRIMARY KEY,
    AlertRuleId INT NOT NULL FOREIGN KEY REFERENCES dbo.AlertRules(AlertRuleId),
    LocationId INT NOT NULL FOREIGN KEY REFERENCES dbo.Locations(LocationId),
    ItemId INT NULL FOREIGN KEY REFERENCES dbo.Items(ItemId),
    BatchId BIGINT NULL FOREIGN KEY REFERENCES dbo.BakingBatches(BatchId),
    PlanLineId BIGINT NULL FOREIGN KEY REFERENCES dbo.BakingPlanLines(PlanLineId),
    Severity NVARCHAR(20) NOT NULL,
    StatusCode NVARCHAR(30) NOT NULL,
    AlertTextMk NVARCHAR(1000) NOT NULL,
    TriggeredAt DATETIME2 NOT NULL,
    AcknowledgedAt DATETIME2 NULL,
    AcknowledgedByUserId BIGINT NULL FOREIGN KEY REFERENCES dbo.Users(UserId),
    ResolvedAt DATETIME2 NULL,
    ResolvedByUserId BIGINT NULL FOREIGN KEY REFERENCES dbo.Users(UserId)
);
GO

CREATE TABLE dbo.DisciplineEvents (
    DisciplineEventId BIGINT IDENTITY PRIMARY KEY,
    LocationId INT NOT NULL FOREIGN KEY REFERENCES dbo.Locations(LocationId),
    UserId BIGINT NULL FOREIGN KEY REFERENCES dbo.Users(UserId),
    EventTypeCode NVARCHAR(50) NOT NULL,
    Severity NVARCHAR(20) NOT NULL,
    ReferenceEntity NVARCHAR(50) NOT NULL,
    ReferenceId BIGINT NOT NULL,
    DescriptionMk NVARCHAR(1000) NOT NULL,
    EventAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

CREATE TABLE dbo.AuditLogs (
    AuditLogId BIGINT IDENTITY PRIMARY KEY,
    EntityName NVARCHAR(100) NOT NULL,
    EntityId NVARCHAR(100) NOT NULL,
    ActionCode NVARCHAR(30) NOT NULL,
    OldValues NVARCHAR(MAX) NULL,
    NewValues NVARCHAR(MAX) NULL,
    ChangedByUserId BIGINT NULL FOREIGN KEY REFERENCES dbo.Users(UserId),
    ChangedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    SourceDevice NVARCHAR(200) NULL,
    CorrelationId UNIQUEIDENTIFIER NULL
);
GO

CREATE TABLE dbo.KpiDailySnapshots (
    SnapshotDate DATE NOT NULL,
    LocationId INT NOT NULL FOREIGN KEY REFERENCES dbo.Locations(LocationId),
    PlannedQty DECIMAL(18,2) NOT NULL DEFAULT 0,
    BakedQty DECIMAL(18,2) NOT NULL DEFAULT 0,
    SoldQty DECIMAL(18,2) NOT NULL DEFAULT 0,
    WasteQty DECIMAL(18,2) NOT NULL DEFAULT 0,
    RealizationPct DECIMAL(9,2) NOT NULL DEFAULT 0,
    WastePct DECIMAL(9,2) NOT NULL DEFAULT 0,
    SalesPct DECIMAL(9,2) NOT NULL DEFAULT 0,
    ShortagePct DECIMAL(9,2) NOT NULL DEFAULT 0,
    OnTimePct DECIMAL(9,2) NOT NULL DEFAULT 0,
    PRIMARY KEY (SnapshotDate, LocationId)
);
GO

CREATE INDEX IX_BakingPlanHeaders_DateLocation ON dbo.BakingPlanHeaders (PlanDate, LocationId);
GO
CREATE INDEX IX_BakingPlanLines_PlanHeader_Term_Item ON dbo.BakingPlanLines (PlanHeaderId, TermId, ItemId);
GO
CREATE INDEX IX_BakingBatches_LocationDate ON dbo.BakingBatches (LocationId, StartTime);
GO
CREATE INDEX IX_WasteEntries_LocationRecordedAt ON dbo.WasteEntries (LocationId, RecordedAt);
GO
CREATE INDEX IX_PosSalesLines_LocationDateItem ON dbo.PosSalesLines (LocationId, BusinessDate, ItemId);
GO
CREATE INDEX IX_Alerts_Status_TriggeredAt ON dbo.Alerts (StatusCode, TriggeredAt);
GO
CREATE INDEX IX_KpiDailySnapshots_Date ON dbo.KpiDailySnapshots (SnapshotDate);
GO
