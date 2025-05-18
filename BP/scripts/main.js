import { world, system, Player } from "@minecraft/server";
import * as fs from "@minecraft/server-admin"; // Para manejar archivos (si es posible)

// Prefijos disponibles
const PREFIXES = {
  "VIP": "§e[VIP]",
  "HELPER": "§a[HELPER]",
  "MODERADOR": "§6[MOD]",
  "ADMIN": "§9[ADMIN]",
  "OWNER": "§c[OWNER]",
  "MIEMBRO": "§7[MIEMBRO]",
  "LEYENDA": "§e§lL§6§lE§e§lY§6§lE§e§lN§6§lD§e§lA",
  "MAESTRO": "§5§lM§d§lA§5§lE§d§lS§5§lT§d§lR§5§lO",
  "DIOS": "§c§lD§6§lI§e§lO§6§lS",
  "DIOSA": "§d§lD§5§lI§d§lO§5§lS§d§lA"
};

// Base de datos simulada (si no hay acceso a archivos)
let playerDB = {};

// Cargar base de datos al inicio
function loadDB() {
  try {
    const data = fs.readFile("scripts/database.json");
    playerDB = JSON.parse(data);
  } catch (e) {
    playerDB = {};
  }
}

// Guardar base de datos
function saveDB() {
  fs.writeFile("scripts/database.json", JSON.stringify(playerDB));
}

// Verificar jugadores nuevos cada 20 segundos
system.runInterval(() => {
  for (const player of world.getPlayers()) {
    const name = player.name;
    if (!playerDB[name]) {
      playerDB[name] = "MIEMBRO";
      player.nameTag = `${PREFIXES["MIEMBRO"]} | ${name}`;
      saveDB();
    }
  }
}, 400); // 20 segundos = 400 ticks

// Comando /prefix
world.beforeEvents.chatSend.subscribe((event) => {
  const message = event.message;
  const player = event.sender;
  
  if (message.startsWith("/prefix ")) {
    event.cancel = true;
    const args = message.split(" ");
    if (args.length < 3 || !player.isOp()) {
      player.sendMessage("§cUso: /prefix <Jugador> <Prefijo>");
      return;
    }
    
    const targetName = args[1];
    const prefixKey = args[2].toUpperCase();
    
    if (!PREFIXES[prefixKey]) {
      player.sendMessage("§cPrefijo no válido. Opciones: VIP, HELPER, MODERADOR, ADMIN, OWNER, MIEMBRO, LEYENDA, MAESTRO, DIOS, DIOSA");
      return;
    }
    
    const target = Array.from(world.getPlayers()).find(p => p.name === targetName);
    if (!target) {
      player.sendMessage(`§cJugador "${targetName}" no encontrado.`);
      return;
    }
    
    playerDB[targetName] = prefixKey;
    target.nameTag = `${PREFIXES[prefixKey]} | ${targetName}`;
    saveDB();
    player.sendMessage(`§aPrefijo de ${targetName} cambiado a ${prefixKey}.`);
  } else {
    // Formato del chat: <Prefix> | <User>: <Message>
    const prefix = PREFIXES[playerDB[player.name] || "MIEMBRO"];
    event.message = `${prefix} | ${player.name}: ${message}`;
  }
});

// Actualizar nameTag al unirse
world.afterEvents.playerSpawn.subscribe((event) => {
  const player = event.player;
  const name = player.name;
  if (!playerDB[name]) {
    playerDB[name] = "MIEMBRO";
    saveDB();
  }
  player.nameTag = `${PREFIXES[playerDB[name]]} | ${name}`;
});

// Iniciar la base de datos
loadDB();
