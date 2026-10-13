'use client';

import React, { useEffect, useState } from 'react';
import {
  Navigation,
  Phone,
  ShieldCheck,
  Clock,
  Compass,
  Bike,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

interface Coordinates {
  lat: number;
  lng: number;
}

interface LiveTrackingMapProps {
  orderNumber: string;
  vendorName: string;
  vendorLocation: { name: string; lat: number; lng: number };
  deliveryLocation: { name: string; lat: number; lng: number };
  riderInfo: {
    name: string;
    phone: string;
    vehiclePlate: string;
    vehicleModel: string;
  };
  initialStatus: string;
}

export default function LiveTrackingMap({
  orderNumber,
  vendorName,
  vendorLocation,
  deliveryLocation,
  riderInfo,
  initialStatus,
}: LiveTrackingMapProps) {
  // Step progress along the route (0% to 100%)
  const [routeProgress, setRouteProgress] = useState(0.35);
  const [speedKmh, setSpeedKmh] = useState(34);
  const [etaMinutes, setEtaMinutes] = useState(7);
  const [currentStatus, setCurrentStatus] = useState(initialStatus || 'OUT_FOR_DELIVERY');
  const [isConnected, setIsConnected] = useState(true);

  // Simulated live GPS coordinate telemetry feed
  useEffect(() => {
    const interval = setInterval(() => {
      setRouteProgress((prev) => {
        if (prev >= 0.98) {
          setCurrentStatus('DELIVERED');
          setEtaMinutes(0);
          setSpeedKmh(0);
          return 1.0;
        }
        const next = prev + 0.02;
        const remainingFraction = 1.0 - next;
        setEtaMinutes(Math.max(1, Math.round(remainingFraction * 12)));
        setSpeedKmh(Math.floor(28 + Math.random() * 12));
        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Compute SVG interpolation coordinates between Vendor and Customer
  // Coordinate space: (50, 200) to (450, 80)
  const vendorX = 60;
  const vendorY = 220;
  const customerX = 440;
  const customerY = 60;

  // Waypoints for natural curve through Ilorin University Road / Tipper Garage
  const waypoint1X = 180;
  const waypoint1Y = 200;
  const waypoint2X = 300;
  const waypoint2Y = 110;

  // Polyline path string
  const pathD = `M ${vendorX} ${vendorY} Q ${waypoint1X} ${waypoint1Y}, 240 150 T ${customerX} ${customerY}`;

  // Current rider interpolated position
  const currentX = vendorX + (customerX - vendorX) * routeProgress;
  // Parabolic arch for road curvature
  const currentY =
    vendorY +
    (customerY - vendorY) * routeProgress -
    Math.sin(routeProgress * Math.PI) * 45;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
      {/* Map Header & Real-Time Connection Indicator */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-wide uppercase text-slate-300">
              Live Rider Telemetry (WebSocket)
            </h3>
            <p className="text-sm font-extrabold text-white">
              {currentStatus === 'DELIVERED'
                ? 'Order Delivered'
                : `Rider En Route • Arriving in ~${etaMinutes} mins`}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono font-bold bg-slate-800 text-emerald-400 px-2.5 py-1 rounded-lg border border-slate-700">
            {speedKmh} km/h
          </span>
        </div>
      </div>

      {/* SVG Interactive Map Canvas */}
      <div className="relative bg-slate-950 h-64 sm:h-72 overflow-hidden flex items-center justify-center">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'linear-gradient(#334155 1px, transparent 1px), linear-gradient(to right, #334155 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <svg viewBox="0 0 500 280" className="w-full h-full">
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>

          {/* Background Route Path */}
          <path
            d={pathD}
            fill="none"
            stroke="#334155"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Active Completed Route Path */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="4 4"
            className="animate-pulse"
          />

          {/* Vendor Pin (Origin) */}
          <g transform={`translate(${vendorX}, ${vendorY})`}>
            <circle r="10" fill="#f59e0b" opacity="0.3" className="animate-ping" />
            <circle r="7" fill="#f59e0b" />
            <text
              y="22"
              textAnchor="middle"
              fill="#fbbf24"
              fontSize="10"
              fontWeight="bold"
            >
              {vendorName}
            </text>
          </g>

          {/* Customer Pin (Destination) */}
          <g transform={`translate(${customerX}, ${customerY})`}>
            <circle r="12" fill="#10b981" opacity="0.2" />
            <circle r="7" fill="#10b981" />
            <text
              y="-12"
              textAnchor="middle"
              fill="#34d399"
              fontSize="10"
              fontWeight="bold"
            >
              Your Delivery Address
            </text>
          </g>

          {/* Animated Rider Motorcycle Icon */}
          <g transform={`translate(${currentX}, ${currentY})`} filter="url(#glow)">
            {/* Pulsing radar waves */}
            <circle r="18" fill="#10b981" opacity="0.25" className="animate-ping" />
            <circle r="12" fill="#047857" stroke="#ffffff" strokeWidth="2" />
            {/* Direction Indicator */}
            <circle r="3" fill="#ffffff" />
          </g>
        </svg>

        {/* Live Cluster Landmark Badge */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur border border-slate-700/80 px-2.5 py-1 rounded-lg text-[10px] text-slate-300 flex items-center gap-1.5 font-medium shadow-lg">
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          Passing Tipper Garage & Tanke Junction • Ilorin
        </div>

        {/* ETA Overlay Pill */}
        <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur border border-slate-700/80 px-3 py-1 rounded-lg text-xs font-extrabold text-white flex items-center gap-1.5 shadow-lg">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          {etaMinutes > 0 ? `ETA: ${etaMinutes} mins` : 'Arrived!'}
        </div>
      </div>

      {/* Assigned Rider Contact & Vehicle Card */}
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-extrabold text-slate-900">
                  {riderInfo.name}
                </h4>
                <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  <ShieldCheck className="w-3 h-3 mr-0.5" /> Verified
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {riderInfo.vehicleModel} •{' '}
                <span className="font-mono font-bold text-slate-700">
                  {riderInfo.vehiclePlate}
                </span>
              </p>
            </div>
          </div>

          <a
            href={`tel:${riderInfo.phone}`}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" />
            Call Rider
          </a>
        </div>

        {/* Address Route Summary */}
        <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold text-slate-700">Pickup:</span>{' '}
              <span className="text-slate-600">{vendorLocation.name}</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold text-slate-700">Destination:</span>{' '}
              <span className="text-slate-600">{deliveryLocation.name}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
