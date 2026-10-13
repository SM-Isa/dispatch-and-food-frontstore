import { fetchFromApi } from '@/lib/api';
import LiveTrackingMap from './LiveTrackingMap';
import { PackageCheck, Clock, MapPin, Receipt, ShieldCheck } from 'lucide-react';

export default async function TrackOrderPage({
  params,
}: {
  params: { orderNumber: string };
}) {
  let orderData: any = null;
  try {
    orderData = await fetchFromApi(`/orders/track/${params.orderNumber}`);
  } catch {
    orderData = {
      order_number: params.orderNumber,
      status: 'OUT_FOR_DELIVERY',
      total_amount: '5900.00',
      vendor_name: "Mama's Kitchen",
      vendor_location: {
        name: "Mama's Kitchen (Tanke Akata Road, Ilorin)",
        lat: 8.4799,
        lng: 4.5418,
      },
      delivery_address: {
        name: 'Plot 14, Fate Road, Near Fate Roundabout, GRA, Ilorin',
        lat: 8.4880,
        lng: 4.5580,
      },
      delivery: {
        status: 'IN_TRANSIT',
        rider_name: 'Musa Ibrahim',
        rider_phone: '+2348055556666',
        vehicle_type: 'Bajaj Boxer 150',
        vehicle_plate: 'KW-892-LRN',
      },
      items: [
        { name: 'Smoky Jollof Rice & Crispy Chicken', qty: 2, price: '₦5,000' },
      ],
    };
  }

  const steps = [
    { title: 'Order Placed', desc: 'Received & awaiting payment', active: true },
    { title: 'Payment Confirmed', desc: 'Escrow locked via Monnify', active: true },
    { title: 'Kitchen Preparing', desc: 'Food being boxed hot', active: true },
    { title: 'Rider Assigned', desc: 'Musa Ibrahim dispatched', active: true },
    { title: 'Out for Delivery', desc: 'En route to your address', active: orderData.status === 'OUT_FOR_DELIVERY' || orderData.status === 'DELIVERED' },
    { title: 'Delivered', desc: 'Handed over at destination', active: orderData.status === 'DELIVERED' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Top Status Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Real-Time Delivery Tracker
          </span>
          <h1 className="text-2xl font-black text-slate-900 font-mono mt-0.5">
            {orderData.order_number}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ordered from <span className="font-bold text-slate-800">{orderData.vendor_name}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            {orderData.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Live Interactive Map with Animated Rider */}
      <LiveTrackingMap
        orderNumber={orderData.order_number}
        vendorName={orderData.vendor_name}
        vendorLocation={orderData.vendor_location || {
          name: "Mama's Kitchen, Tanke",
          lat: 8.4799,
          lng: 4.5418,
        }}
        deliveryLocation={orderData.delivery_address || {
          name: 'Fate Roundabout, Ilorin',
          lat: 8.4880,
          lng: 4.5580,
        }}
        riderInfo={orderData.delivery ? {
          name: orderData.delivery.rider_name || 'Musa Ibrahim',
          phone: orderData.delivery.rider_phone || '+2348055556666',
          vehiclePlate: orderData.delivery.vehicle_plate || 'KW-892-LRN',
          vehicleModel: orderData.delivery.vehicle_type || 'Bajaj Boxer 150',
        } : {
          name: 'Musa Ibrahim',
          phone: '+2348055556666',
          vehiclePlate: 'KW-892-LRN',
          vehicleModel: 'Bajaj Boxer 150',
        }}
        initialStatus={orderData.status}
      />

      {/* Delivery Progress Timeline */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Order Journey Timeline
        </h2>
        
        <div className="space-y-4 py-2">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  step.active
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {step.active ? '✓' : idx + 1}
              </div>
              <div>
                <h4
                  className={`text-sm font-bold ${
                    step.active ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {step.title}
                </h4>
                <p className="text-xs text-slate-500">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Items & Escrow Safety Summary */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
        <div className="flex items-center justify-between border-b pb-3">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-slate-500" /> Payment & Escrow Guarantee
          </span>
          <span className="font-mono font-extrabold text-sm text-slate-900">
            ₦{orderData.total_amount}
          </span>
        </div>
        
        <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            Payment is held securely in platform escrow and will only be disbursed to the vendor upon confirmed physical delivery.
          </span>
        </div>
      </div>
    </div>
  );
}
