import { NextResponse } from "next/server";

import { env } from "@/src/lib/env";
import { createResendClient } from "@/src/lib/resend";

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length);
}

export async function POST(request: Request) {
  if (!env.resendTestToken) {
    return NextResponse.json({ error: "Email test endpoint is disabled." }, { status: 404 });
  }

  if (getBearerToken(request) !== env.resendTestToken) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!env.resendFromEmail || !env.resendTestToEmail) {
    return NextResponse.json(
      { error: "RESEND_FROM_EMAIL and RESEND_TEST_TO_EMAIL are required." },
      { status: 500 },
    );
  }

  try {
    const resend = createResendClient();

    const { data, error } = await resend.emails.send({
      from: env.resendFromEmail,
      to: env.resendTestToEmail,
      subject: "Hello World",
      html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
    });

    if (error) {
      return NextResponse.json({ error }, { status: 502 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email." },
      { status: 500 },
    );
  }
}
