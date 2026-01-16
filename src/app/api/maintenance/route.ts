import { NextResponse } from 'next/server';

/**
 * Maintenance API Endpoint
 *
 * Returns a 503 Service Unavailable response when the site is in maintenance mode.
 * All API requests are rewritten to this endpoint when site_enabled is false.
 */

const maintenanceResponse = {
  error: 'Service Unavailable',
  message: "We're taking a moment to improve your experience. Please check back shortly.",
  status: 503,
};

export async function GET() {
  return NextResponse.json(maintenanceResponse, { status: 503 });
}

export async function POST() {
  return NextResponse.json(maintenanceResponse, { status: 503 });
}

export async function PUT() {
  return NextResponse.json(maintenanceResponse, { status: 503 });
}

export async function PATCH() {
  return NextResponse.json(maintenanceResponse, { status: 503 });
}

export async function DELETE() {
  return NextResponse.json(maintenanceResponse, { status: 503 });
}

export async function OPTIONS() {
  return NextResponse.json(maintenanceResponse, { status: 503 });
}
