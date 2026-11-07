# Configuration transfer to maintained MV3

The built-in MV2 migration workflow has been removed. Current packages do not
read historical extension `localStorage` or request `offscreen` for migration.

Use the manual Import / Export workflow in the
[user guide](../user/USER_GUIDE.md) to transfer supported settings. Import creates
Saved configuration only; it neither applies settings nor enables protection.

Historical implementation notes remain in
[MV3_LEGACY_MIGRATION_PHASE_NOTES.md](../legacy/audits/MV3_LEGACY_MIGRATION_PHASE_NOTES.md).
