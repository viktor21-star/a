ALTER TABLE dbo.UserLocations
ADD CanUsePekara BIT NOT NULL CONSTRAINT DF_UserLocations_CanUsePekara DEFAULT 0;
GO

ALTER TABLE dbo.UserLocations
ADD CanUsePecenjara BIT NOT NULL CONSTRAINT DF_UserLocations_CanUsePecenjara DEFAULT 0;
GO

ALTER TABLE dbo.UserLocations
ADD CanUsePijara BIT NOT NULL CONSTRAINT DF_UserLocations_CanUsePijara DEFAULT 0;
GO

ALTER TABLE dbo.UserLocations
ADD PekaraOvenType NVARCHAR(64) NULL;
GO

ALTER TABLE dbo.UserLocations
ADD PecenjaraOvenType NVARCHAR(64) NULL;
GO
