import { RequestType } from "@prisma/client";

/**
 * Sends a WhatsApp notification to the practice manager when a new request is submitted.
 * Uses the free CallMeBot API.
 */
export async function sendWhatsAppNotification(data: {
  employeeName: string;
  type: RequestType;
  hours: number;
  date: Date;
  reason: string;
}) {
  const phone = process.env.WHATSAPP_PHONE;
  const apiKey = process.env.WHATSAPP_API_KEY;

  if (!phone || !apiKey) {
    console.log(
      "[Notification] WhatsApp credentials not configured. Skipping notification. Details:",
      data
    );
    return;
  }

  const formattedDate = new Date(data.date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const typeString = data.type === RequestType.OVERTIME ? "➕ Überstunden" : "➖ Freizeitausgleich";
  const hoursString = `${data.hours.toFixed(2).replace(".", ",")} Std.`;

  const message = 
`⏰ *Neuer Antrag eingereicht!*

👤 *Mitarbeiterin:* ${data.employeeName}
📅 *Datum:* ${formattedDate}
⏱️ *Typ:* ${typeString}
⏳ *Dauer:* ${hoursString}
📝 *Grund:* ${data.reason}

👉 _Hier prüfen & freigeben:_ ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin`;

  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(
      phone
    )}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error(
        "[Notification] CallMeBot API failed with status:",
        response.status
      );
    } else {
      console.log("[Notification] WhatsApp message sent successfully!");
    }
  } catch (error) {
    console.error("[Notification] Error calling CallMeBot API:", error);
  }
}
