# 🌌 Nebula Bot — User Manual

Welcome to **Nebula Bot**, a moderation + logging utility built for server control.

━━━━━━━━━━━━━━━━━━━━━━
## PREFIXES
━━━━━━━━━━━━━━━━━━━━━━

Admin command prefixes:

;
!
?
/

Setup-only prefix:

$

Examples:
;kick @user reason
!ban @user
?warn @user
/timeout @user 5m

━━━━━━━━━━━━━━━━━━━━━━
## MODERATION COMMANDS
━━━━━━━━━━━━━━━━━━━━━━

### kick
Removes a user from the server.

Usage:
;kick @user [reason]

Example:
;kick @NebulaUser Spamming


━━━━━━━━━━━━━━━━━━━━━━

### ban
Permanently bans a user.

Usage:
;ban @user [reason]

Example:
!ban @NebulaUser Toxic behavior


━━━━━━━━━━━━━━━━━━━━━━

### warn
Warn system:

Warn 1 → Standard warning  
Warn 2 → Automatic 5 minute timeout

Usage:
;warn @user [reason]

Example:
?warn @NebulaUser Language


━━━━━━━━━━━━━━━━━━━━━━

### timeout
Temporarily restricts a user.

Usage:
;timeout @user TIME [reason]

Time options:
1m
5m
15m
1h
3h
12h
1d
1w

Example:
;timeout @NebulaUser 15m Spam


━━━━━━━━━━━━━━━━━━━━━━
## POLLS
━━━━━━━━━━━━━━━━━━━━━━

Creates an embedded multiple-choice poll.

Usage:
;poll #channel QUESTION | OPTION1 | OPTION2 | OPTION3

Example:
;poll #general What should we do tonight? | Rblx | Minecraft | Valorant

Bot response:

What should we do tonight?

1️⃣ Rblx
2️⃣ Minecraft
3️⃣ Valorant

Users vote using reactions.


━━━━━━━━━━━━━━━━━━━━━━
## SETUP COMMANDS
━━━━━━━━━━━━━━━━━━━━━━

### Set Password

Required before configuration.

Usage:
$set N3BULA


━━━━━━━━━━━━━━━━━━━━━━

### Set Log Channel

Sets moderation log destination.

Usage:
$setlog #channel


━━━━━━━━━━━━━━━━━━━━━━
## LOGGING FEATURES
━━━━━━━━━━━━━━━━━━━━━━

Nebula logs:

✓ Deleted messages  
✓ Channel/category creation  
✓ Channel/category deletion  
✓ Permission edits  
✓ Kicks  
✓ Bans  
✓ Timeouts  
✓ Voice disconnects  
✓ Voice moves  
✓ Role creation/deletion  
✓ Role permission changes  
✓ Voice joins  
✓ All command executions


━━━━━━━━━━━━━━━━━━━━━━
## PERMISSIONS REQUIRED
━━━━━━━━━━━━━━━━━━━━━━

Nebula Bot requires:

Administrator

OR:

Manage Messages  
Kick Members  
Ban Members  
Moderate Members  
Manage Channels  
Manage Roles  
View Audit Log


━━━━━━━━━━━━━━━━━━━━━━
## TROUBLESHOOTING
━━━━━━━━━━━━━━━━━━━━━━

Bot not responding?

1. Check bot is online
2. Verify correct prefix
3. Confirm permissions
4. Ensure setup completed

Setup checklist:

$set N3BULA
$setlog #logs
