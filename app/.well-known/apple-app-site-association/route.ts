import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function resolveAppId(): string | null {
    const teamId = process.env.IOS_TEAM_ID?.trim();
    const bundleId = process.env.IOS_BUNDLE_ID?.trim();
    if (!teamId || !bundleId) {
        return null;
    }
    return `${teamId}.${bundleId}`;
}

function resolveAppClipId(): string | null {
    const teamId = process.env.IOS_TEAM_ID?.trim();
    const appClipBundleId = process.env.IOS_APPCLIP_BUNDLE_ID?.trim();
    if (!teamId || !appClipBundleId) {
        return null;
    }
    return `${teamId}.${appClipBundleId}`;
}

export async function GET() {
    const appId = resolveAppId();
    const appClipId = resolveAppClipId();

    const payload = appId
        ? {
            applinks: {
                apps: [],
                details: [
                    {
                        appID: appId,
                        paths: [
                            '/product/*',
                            '/brand/*',
                            '/category/*',
                            '/search/*',
                            '/p/*',
                        ],
                    },
                ],
            },
            webcredentials: {
                apps: [appId],
            },
            appclips: {
                apps: appClipId ? [appClipId] : [],
            },
        }
        : {
            applinks: {
                apps: [],
                details: [],
            },
            webcredentials: {
                apps: [],
            },
            appclips: {
                apps: [],
            },
            warning: 'IOS_TEAM_ID and IOS_BUNDLE_ID are required for Universal Links.',
        };

    return NextResponse.json(payload, {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300',
        },
    });
}
