require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  PermissionFlagsBits,
  AuditLogEvent,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

// ─── Storage ─────────────────────────────────────────────────────────────────

const warns = new Map();       // userId -> warnCount
const logChannels = new Map(); // guildId -> channelId
const setupPassword = "N3BULA";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ADMIN_PREFIXES = [";", "!", "?", "/"];
const SETUP_PREFIX = "$";

const NUMBER_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

const TIMEOUT_DURATIONS = {
  "1m":  60 * 1000,
  "5m":  5  * 60 * 1000,
  "15m": 15 * 60 * 1000,
  "1h":  60 * 60 * 1000,
  "3h":  3  * 60 * 60 * 1000,
  "12h": 12 * 60 * 60 * 1000,
  "1d":  24 * 60 * 60 * 1000,
  "1w":  7  * 24 * 60 * 60 * 1000,
};

function isAdmin(member) {
  return (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.permissions.has(PermissionFlagsBits.KickMembers) ||
    member.permissions.has(PermissionFlagsBits.BanMembers) ||
    member.permissions.has(PermissionFlagsBits.ModerateMembers)
  );
}

function sendLog(guild, embed) {
  const channelId = logChannels.get(guild.id);
  if (!channelId) return;
  const channel = guild.channels.cache.get(channelId);
  if (channel) channel.send({ embeds: [embed] }).catch(() => {});
}

function logEmbed(color, title, fields = []) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .addFields(fields)
    .setTimestamp();
}

// ─── Ready ────────────────────────────────────────────────────────────────────

client.once("ready", () => {
  console.log(`Nebula Bot is online as ${client.user.tag}`);
  client.user.setActivity("⭐ Nebula Bot | use ; ! ? /");
});

// ─── Message Commands ─────────────────────────────────────────────────────────

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const content = message.content.trim();

  // ── Setup prefix ($) ──────────────────────────────────────────────────────
  if (content.startsWith(SETUP_PREFIX)) {
    const args = content.slice(SETUP_PREFIX.length).trim().split(/\s+/);
    const cmd = args[0]?.toLowerCase();

    if (cmd === "set") {
      const password = args[1];
      if (password === setupPassword) {
        message.reply("✅ Password accepted! Nebula Bot is now set up for this server.");
      } else {
        message.reply("❌ Incorrect password.");
      }
      return;
    }

    if (cmd === "setlog") {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply("❌ You need Administrator permission to use setup commands.");
      }
      const channel =
        message.mentions.channels.first() ||
        message.guild.channels.cache.get(args[1]);
      if (!channel) {
        return message.reply("❌ Please mention a valid channel. Example: `$setlog #logs`");
      }
      logChannels.set(message.guild.id, channel.id);
      message.reply(`✅ Log channel set to ${channel}.`);

      sendLog(
        message.guild,
        logEmbed(0x5865f2, "📋 Log Channel Configured", [
          { name: "Channel", value: `${channel}`, inline: true },
          { name: "Set by", value: `${message.author.tag}`, inline: true },
        ])
      );
      return;
    }
    return;
  }

  // ── Admin prefixes (;  !  ?  /) ───────────────────────────────────────────
  const usedPrefix = ADMIN_PREFIXES.find((p) => content.startsWith(p));
  if (!usedPrefix) return;

  if (!isAdmin(message.member)) {
    return message.reply("❌ You don't have permission to use bot commands.");
  }

  const args = content.slice(usedPrefix.length).trim().split(/\s+/);
  const cmd = args[0]?.toLowerCase();

  // ── KICK ──────────────────────────────────────────────────────────────────
  if (cmd === "kick") {
    const target =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[1]);
    if (!target) return message.reply("❌ Please mention a member to kick.");
    if (!target.kickable) return message.reply("❌ I can't kick that member.");

    const reason = args.slice(2).join(" ") || "No reason provided";
    await target.kick(reason).catch(() => null);

    const embed = new EmbedBuilder()
      .setColor(0xff6b35)
      .setTitle("👟 Member Kicked")
      .addFields(
        { name: "Member", value: `${target.user.tag}`, inline: true },
        { name: "Moderator", value: `${message.author.tag}`, inline: true },
        { name: "Reason", value: reason }
      )
      .setTimestamp();

    message.reply({ embeds: [embed] });
    sendLog(message.guild, embed);
    logCommandUsed(message, `Kick - ${target.user.tag}`);
    return;
  }

  // ── BAN ───────────────────────────────────────────────────────────────────
  if (cmd === "ban") {
    const target =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[1]);
    if (!target) return message.reply("❌ Please mention a member to ban.");
    if (!target.bannable) return message.reply("❌ I can't ban that member.");

    const reason = args.slice(2).join(" ") || "No reason provided";
    await target.ban({ reason }).catch(() => null);

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("🔨 Member Banned")
      .addFields(
        { name: "Member", value: `${target.user.tag}`, inline: true },
        { name: "Moderator", value: `${message.author.tag}`, inline: true },
        { name: "Reason", value: reason }
      )
      .setTimestamp();

    message.reply({ embeds: [embed] });
    sendLog(message.guild, embed);
    logCommandUsed(message, `Ban - ${target.user.tag}`);
    return;
  }

  // ── WARN ──────────────────────────────────────────────────────────────────
  if (cmd === "warn") {
    const target =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[1]);
    const level = parseInt(args[args.length - 1]);

    if (!target) return message.reply("❌ Please mention a member to warn.");
    if (level !== 1 && level !== 2)
      return message.reply("❌ Specify warn level: `warn @user 1` or `warn @user 2`");

    const key = `${message.guild.id}-${target.id}`;
    const current = warns.get(key) || 0;
    warns.set(key, current + 1);

    if (level === 1) {
      const embed = new EmbedBuilder()
        .setColor(0xffa500)
        .setTitle("⚠️ Member Warned")
        .addFields(
          { name: "Member", value: `${target.user.tag}`, inline: true },
          { name: "Moderator", value: `${message.author.tag}`, inline: true },
          { name: "Total Warns", value: `${current + 1}`, inline: true }
        )
        .setTimestamp();

      message.reply({ embeds: [embed] });
      sendLog(message.guild, embed);

      try {
        await target.send(
          `⚠️ You have been warned in **${message.guild.name}**. Total warnings: ${current + 1}`
        );
      } catch {}
    } else if (level === 2) {
      if (!target.moderatable)
        return message.reply("❌ I can't timeout that member.");

      await target.timeout(5 * 60 * 1000, "Warn level 2 - automatic timeout").catch(() => null);

      const embed = new EmbedBuilder()
        .setColor(0xff8c00)
        .setTitle("⚠️🔇 Member Warned + Timed Out (5 min)")
        .addFields(
          { name: "Member", value: `${target.user.tag}`, inline: true },
          { name: "Moderator", value: `${message.author.tag}`, inline: true },
          { name: "Total Warns", value: `${current + 1}`, inline: true },
          { name: "Timeout", value: "5 minutes" }
        )
        .setTimestamp();

      message.reply({ embeds: [embed] });
      sendLog(message.guild, embed);

      try {
        await target.send(
          `⚠️ You have been warned (level 2) and timed out for 5 minutes in **${message.guild.name}**. Total warnings: ${current + 1}`
        );
      } catch {}
    }

    logCommandUsed(message, `Warn level ${level} - ${target.user.tag}`);
    return;
  }

  // ── TIMEOUT ───────────────────────────────────────────────────────────────
  if (cmd === "timeout") {
    const target =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[1]);
    const durationArg = args[2]?.toLowerCase();

    if (!target) return message.reply("❌ Please mention a member to timeout.");
    if (!durationArg || !TIMEOUT_DURATIONS[durationArg]) {
      return message.reply(
        `❌ Invalid duration. Options: \`${Object.keys(TIMEOUT_DURATIONS).join(" | ")}\``
      );
    }
    if (!target.moderatable)
      return message.reply("❌ I can't timeout that member.");

    const reason = args.slice(3).join(" ") || "No reason provided";
    const ms = TIMEOUT_DURATIONS[durationArg];
    await target.timeout(ms, reason).catch(() => null);

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle("🔇 Member Timed Out")
      .addFields(
        { name: "Member", value: `${target.user.tag}`, inline: true },
        { name: "Moderator", value: `${message.author.tag}`, inline: true },
        { name: "Duration", value: durationArg, inline: true },
        { name: "Reason", value: reason }
      )
      .setTimestamp();

    message.reply({ embeds: [embed] });
    sendLog(message.guild, embed);
    logCommandUsed(message, `Timeout ${durationArg} - ${target.user.tag}`);
    return;
  }

  // ── POLL ──────────────────────────────────────────────────────────────────
  if (cmd === "poll") {
    // Usage: !poll #channel Question? Answer1 Answer2 Answer3 ...
    const channelMention = args[1];
    const targetChannel =
      message.mentions.channels.first() ||
      message.guild.channels.cache.get(channelMention);

    if (!targetChannel) {
      return message.reply(
        "❌ Please mention the channel first. Example:\n`!poll #general What to play? Roblox Minecraft Valorant`"
      );
    }

    // Everything after the channel mention
    const rest = args.slice(2);
    if (rest.length < 2) {
      return message.reply("❌ Please provide a question and at least one answer.");
    }

    // First word-group ending in ? is the question, rest are answers
    // Or just treat first item as question, rest as answers
    let question = "";
    let answers = [];

    // Find where the question ends (ends with ?)
    let qi = 0;
    const questionParts = [];
    for (let i = 0; i < rest.length; i++) {
      questionParts.push(rest[i]);
      qi = i + 1;
      if (rest[i].endsWith("?")) break;
    }
    question = questionParts.join(" ");
    if (!question.endsWith("?")) question += "?";
    answers = rest.slice(qi);

    if (answers.length === 0) {
      return message.reply("❌ Please provide at least one answer after the question.");
    }
    if (answers.length > 10) {
      return message.reply("❌ Maximum 10 answers allowed.");
    }

    const answerLines = answers
      .map((a, i) => `${NUMBER_EMOJIS[i]}  **${a}**`)
      .join("\n");

    const divider = "═".repeat(32);

    const pollEmbed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`📊 ${question}`)
      .setDescription(`${divider}\n${answerLines}\n${divider}`)
      .setFooter({ text: `Poll by ${message.author.tag} • React to vote!` })
      .setTimestamp();

    const pollMsg = await targetChannel.send({ embeds: [pollEmbed] });

    for (let i = 0; i < answers.length; i++) {
      await pollMsg.react(NUMBER_EMOJIS[i]).catch(() => {});
    }

    message.reply(`✅ Poll posted in ${targetChannel}!`);
    logCommandUsed(message, `Poll in ${targetChannel.name}: ${question}`);
    return;
  }
});

// ─── Logging Helper ───────────────────────────────────────────────────────────

function logCommandUsed(message, commandInfo) {
  sendLog(
    message.guild,
    logEmbed(0x7289da, "🤖 Command Used", [
      { name: "Command", value: commandInfo, inline: true },
      { name: "Used by", value: `${message.author.tag}`, inline: true },
      { name: "Channel", value: `${message.channel}`, inline: true },
    ])
  );
}

// ─── Logging: Deleted Messages ────────────────────────────────────────────────

client.on("messageDelete", (message) => {
  if (!message.guild || message.author?.bot) return;

  sendLog(
    message.guild,
    logEmbed(0xe74c3c, "🗑️ Message Deleted", [
      { name: "Author", value: `${message.author?.tag ?? "Unknown"}`, inline: true },
      { name: "Channel", value: `${message.channel}`, inline: true },
      {
        name: "Content",
        value: message.content?.slice(0, 1000) || "*No content / attachment only*",
      },
    ])
  );
});

// ─── Logging: Channels & Categories ──────────────────────────────────────────

client.on("channelCreate", (channel) => {
  if (!channel.guild) return;
  sendLog(
    channel.guild,
    logEmbed(0x2ecc71, "📁 Channel Created", [
      { name: "Channel", value: `${channel.name}`, inline: true },
      { name: "Type", value: `${channel.type}`, inline: true },
    ])
  );
});

client.on("channelDelete", (channel) => {
  if (!channel.guild) return;
  sendLog(
    channel.guild,
    logEmbed(0xe74c3c, "📁 Channel Deleted", [
      { name: "Channel", value: `${channel.name}`, inline: true },
      { name: "Type", value: `${channel.type}`, inline: true },
    ])
  );
});

client.on("channelUpdate", (oldChannel, newChannel) => {
  if (!newChannel.guild) return;
  const changes = [];
  if (oldChannel.name !== newChannel.name)
    changes.push(`Name: \`${oldChannel.name}\` → \`${newChannel.name}\``);
  if (oldChannel.topic !== newChannel.topic)
    changes.push(`Topic changed`);
  if (oldChannel.permissionsLocked !== newChannel.permissionsLocked)
    changes.push(`Permission sync changed`);
  if (!changes.length) {
    changes.push("Permissions or settings updated");
  }

  sendLog(
    newChannel.guild,
    logEmbed(0xf1c40f, "✏️ Channel Updated", [
      { name: "Channel", value: `${newChannel.name}`, inline: true },
      { name: "Changes", value: changes.join("\n") },
    ])
  );
});

// ─── Logging: Roles ───────────────────────────────────────────────────────────

client.on("roleCreate", (role) => {
  sendLog(
    role.guild,
    logEmbed(0x2ecc71, "🏷️ Role Created", [
      { name: "Role", value: `${role.name}`, inline: true },
    ])
  );
});

client.on("roleDelete", (role) => {
  sendLog(
    role.guild,
    logEmbed(0xe74c3c, "🏷️ Role Deleted", [
      { name: "Role", value: `${role.name}`, inline: true },
    ])
  );
});

client.on("roleUpdate", (oldRole, newRole) => {
  const changes = [];
  if (oldRole.name !== newRole.name)
    changes.push(`Name: \`${oldRole.name}\` → \`${newRole.name}\``);
  if (oldRole.color !== newRole.color)
    changes.push(`Color changed`);
  if (!oldRole.permissions.equals(newRole.permissions))
    changes.push(`Permissions updated`);
  if (!changes.length) return;

  sendLog(
    newRole.guild,
    logEmbed(0xf1c40f, "✏️ Role Updated", [
      { name: "Role", value: `${newRole.name}`, inline: true },
      { name: "Changes", value: changes.join("\n") },
    ])
  );
});

// ─── Logging: Member Updates (kicks are via guildMemberRemove + audit log) ────

client.on("guildMemberRemove", async (member) => {
  await new Promise((r) => setTimeout(r, 1000));
  const audit = await member.guild
    .fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 1 })
    .catch(() => null);

  const entry = audit?.entries.first();
  const wasKick =
    entry && entry.target?.id === member.id && Date.now() - entry.createdTimestamp < 5000;

  if (wasKick) {
    sendLog(
      member.guild,
      logEmbed(0xff6b35, "👟 Member Kicked (Audit)", [
        { name: "Member", value: `${member.user.tag}`, inline: true },
        { name: "By", value: `${entry.executor?.tag ?? "Unknown"}`, inline: true },
        { name: "Reason", value: entry.reason || "No reason provided" },
      ])
    );
  }
});

client.on("guildBanAdd", async (ban) => {
  await new Promise((r) => setTimeout(r, 500));
  const audit = await ban.guild
    .fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 })
    .catch(() => null);
  const entry = audit?.entries.first();

  sendLog(
    ban.guild,
    logEmbed(0xff0000, "🔨 Member Banned (Audit)", [
      { name: "Member", value: `${ban.user.tag}`, inline: true },
      { name: "By", value: `${entry?.executor?.tag ?? "Unknown"}`, inline: true },
      { name: "Reason", value: ban.reason || entry?.reason || "No reason provided" },
    ])
  );
});

client.on("guildMemberUpdate", async (oldMember, newMember) => {
  // Detect timeout applied or removed
  const wasTimedOut = !oldMember.communicationDisabledUntil && newMember.communicationDisabledUntil;
  const timeoutLifted = oldMember.communicationDisabledUntil && !newMember.communicationDisabledUntil;

  if (wasTimedOut) {
    await new Promise((r) => setTimeout(r, 500));
    const audit = await newMember.guild
      .fetchAuditLogs({ type: AuditLogEvent.MemberUpdate, limit: 1 })
      .catch(() => null);
    const entry = audit?.entries.first();

    sendLog(
      newMember.guild,
      logEmbed(0x9b59b6, "🔇 Member Timed Out (Audit)", [
        { name: "Member", value: `${newMember.user.tag}`, inline: true },
        { name: "By", value: `${entry?.executor?.tag ?? "Unknown"}`, inline: true },
        {
          name: "Until",
          value: `<t:${Math.floor(newMember.communicationDisabledUntil.getTime() / 1000)}:R>`,
        },
      ])
    );
  }

  if (timeoutLifted) {
    sendLog(
      newMember.guild,
      logEmbed(0x2ecc71, "🔊 Timeout Lifted", [
        { name: "Member", value: `${newMember.user.tag}`, inline: true },
      ])
    );
  }

  // Role changes
  const added = newMember.roles.cache.filter((r) => !oldMember.roles.cache.has(r.id));
  const removed = oldMember.roles.cache.filter((r) => !newMember.roles.cache.has(r.id));

  if (added.size > 0) {
    sendLog(
      newMember.guild,
      logEmbed(0x2ecc71, "➕ Roles Added to Member", [
        { name: "Member", value: `${newMember.user.tag}`, inline: true },
        { name: "Roles Added", value: added.map((r) => r.name).join(", ") },
      ])
    );
  }

  if (removed.size > 0) {
    sendLog(
      newMember.guild,
      logEmbed(0xe74c3c, "➖ Roles Removed from Member", [
        { name: "Member", value: `${newMember.user.tag}`, inline: true },
        { name: "Roles Removed", value: removed.map((r) => r.name).join(", ") },
      ])
    );
  }
});

// ─── Logging: Voice State (Join / Disconnect / Move) ─────────────────────────

client.on("voiceStateUpdate", async (oldState, newState) => {
  const member = newState.member;
  if (!member) return;

  // Joined a channel
  if (!oldState.channelId && newState.channelId) {
    sendLog(
      newState.guild,
      logEmbed(0x1abc9c, "🎤 Joined Voice Channel", [
        { name: "Member", value: `${member.user.tag}`, inline: true },
        { name: "Channel", value: `${newState.channel?.name}`, inline: true },
      ])
    );
  }

  // Left a channel
  if (oldState.channelId && !newState.channelId) {
    await new Promise((r) => setTimeout(r, 500));

    // Check if it was a disconnect via mod
    const audit = await oldState.guild
      .fetchAuditLogs({ type: AuditLogEvent.MemberDisconnect, limit: 1 })
      .catch(() => null);
    const entry = audit?.entries.first();
    const wasDisconnected =
      entry && Date.now() - entry.createdTimestamp < 5000;

    if (wasDisconnected) {
      sendLog(
        oldState.guild,
        logEmbed(0xff6b35, "🔌 Member Disconnected from VC (Mod)", [
          { name: "Member", value: `${member.user.tag}`, inline: true },
          { name: "Channel", value: `${oldState.channel?.name}`, inline: true },
          { name: "By", value: `${entry.executor?.tag ?? "Unknown"}`, inline: true },
        ])
      );
    } else {
      sendLog(
        oldState.guild,
        logEmbed(0x95a5a6, "🚪 Left Voice Channel", [
          { name: "Member", value: `${member.user.tag}`, inline: true },
          { name: "Channel", value: `${oldState.channel?.name}`, inline: true },
        ])
      );
    }
  }

  // Moved between channels
  if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
    await new Promise((r) => setTimeout(r, 500));
    const audit = await newState.guild
      .fetchAuditLogs({ type: AuditLogEvent.MemberMove, limit: 1 })
      .catch(() => null);
    const entry = audit?.entries.first();
    const wasMoved = entry && Date.now() - entry.createdTimestamp < 5000;

    sendLog(
      newState.guild,
      logEmbed(0xf39c12, wasMoved ? "🔀 Member Moved by Mod" : "🔀 Member Moved VC", [
        { name: "Member", value: `${member.user.tag}`, inline: true },
        { name: "From", value: `${oldState.channel?.name}`, inline: true },
        { name: "To", value: `${newState.channel?.name}`, inline: true },
        ...(wasMoved ? [{ name: "By", value: `${entry.executor?.tag ?? "Unknown"}`, inline: true }] : []),
      ])
    );
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────

client.login(process.env.DISCORD_TOKEN);
