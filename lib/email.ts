import net from "node:net";
import tls from "node:tls";

interface SendEmailInput {
  from: string;
  password: string;
  to: string[];
  cc?: string[];
  subject: string;
  text: string;
  timeoutMs?: number;
}

type SmtpSocket = net.Socket | tls.TLSSocket;

function readResponse(socket: SmtpSocket): Promise<string> {
  return new Promise((resolve, reject) => {
    let buffer = "";
    const onData = (chunk: Buffer) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      const lastLine = lines[lines.length - 1];
      if (lastLine && /^\d{3} /.test(lastLine)) {
        cleanup();
        resolve(buffer);
      }
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
    };
    socket.on("data", onData);
    socket.on("error", onError);
  });
}

async function command(socket: SmtpSocket, value: string, expected: number[]): Promise<string> {
  socket.write(`${value}\r\n`);
  const response = await readResponse(socket);
  const code = Number.parseInt(response.slice(0, 3), 10);
  if (!expected.includes(code)) {
    throw new Error(`SMTP command failed: ${value.replace(/\s.+$/, " ...")} -> ${response.trim()}`);
  }
  return response;
}

function encodeHeader(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function dotEscape(value: string): string {
  return value.replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
}

export async function sendGmailSmtpEmail(input: SendEmailInput): Promise<void> {
  const recipients = [...input.to, ...(input.cc ?? [])];
  if (recipients.length === 0) throw new Error("No email recipients configured");

  const timeoutMs = input.timeoutMs ?? 12_000;
  let socket: SmtpSocket = net.connect({
    host: "smtp.gmail.com",
    port: 587,
  });
  socket.setTimeout(timeoutMs);

  try {
    socket.on("timeout", () => {
      socket.destroy(new Error(`SMTP connection timed out after ${timeoutMs}ms`));
    });
    await readResponse(socket);
    await command(socket, "EHLO localhost", [250]);
    await command(socket, "STARTTLS", [220]);

    socket = tls.connect({
      socket,
      servername: "smtp.gmail.com",
    });
    socket.setTimeout(timeoutMs);
    socket.on("timeout", () => {
      socket.destroy(new Error(`SMTP connection timed out after ${timeoutMs}ms`));
    });
    await new Promise<void>((resolve, reject) => {
      socket.once("secureConnect", resolve);
      socket.once("error", reject);
    });

    await command(socket, "EHLO localhost", [250]);
    await command(socket, "AUTH LOGIN", [334]);
    await command(socket, Buffer.from(input.from).toString("base64"), [334]);
    await command(socket, Buffer.from(input.password).toString("base64"), [235]);
    await command(socket, `MAIL FROM:<${input.from}>`, [250]);
    for (const recipient of recipients) {
      await command(socket, `RCPT TO:<${recipient}>`, [250, 251]);
    }
    await command(socket, "DATA", [354]);

    const headers = [
      `From: ${input.from}`,
      `To: ${input.to.join(", ")}`,
      input.cc?.length ? `Cc: ${input.cc.join(", ")}` : "",
      `Subject: ${encodeHeader(input.subject)}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=utf-8",
    ].filter(Boolean);

    socket.write(`${headers.join("\r\n")}\r\n\r\n${dotEscape(input.text)}\r\n.\r\n`);
    const dataResponse = await readResponse(socket);
    const dataCode = Number.parseInt(dataResponse.slice(0, 3), 10);
    if (dataCode !== 250) throw new Error(`SMTP DATA failed: ${dataResponse.trim()}`);
    await command(socket, "QUIT", [221]);
  } finally {
    socket.end();
  }
}
