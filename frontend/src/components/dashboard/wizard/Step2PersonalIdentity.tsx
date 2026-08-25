'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Mail, Phone, MapPin, HeartHandshake } from 'lucide-react';

interface Step2Props {
  data: any;
  onChange: (fields: Record<string, any>) => void;
}

export function Step2PersonalIdentity({ data, onChange }: Step2Props) {
  const identity = data.identity || {};

  const handleUpdate = (field: string, value: any) => {
    onChange({
      identity: {
        ...identity,
        [field]: value,
      },
    });
  };

  const handleAddressUpdate = (field: string, value: any) => {
    onChange({
      identity: {
        ...identity,
        currentAddress: {
          ...(identity.currentAddress || {}),
          [field]: value,
        },
      },
    });
  };

  const handleEmergencyUpdate = (field: string, value: any) => {
    onChange({
      identity: {
        ...identity,
        emergencyContact: {
          ...(identity.emergencyContact || {}),
          [field]: value,
        },
      },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="border-b border-border pb-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Step 2: Personal Identity & Contact
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Enter your official legal name as it appears on your passport and your primary contact details.
        </p>
      </div>

      {/* Name Details */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="space-y-1.5 sm:col-span-1">
          <Label className="text-xs font-semibold">Title</Label>
          <Select
            value={identity.title || 'Mr'}
            onValueChange={(val) => handleUpdate('title', val)}
          >
            <SelectTrigger className="h-9 text-xs bg-card">
              <SelectValue placeholder="Title" />
            </SelectTrigger>
            <SelectContent>
              {['Mr', 'Ms', 'Mrs', 'Mx', 'Dr', 'Prof'].map((t) => (
                <SelectItem key={t} value={t} className="text-xs">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 sm:col-span-1">
          <Label className="text-xs font-semibold">First Name *</Label>
          <Input
            value={identity.firstName || ''}
            onChange={(e) => handleUpdate('firstName', e.target.value)}
            placeholder="Legal given name"
            className="text-xs h-9"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-1">
          <Label className="text-xs font-semibold">Middle Name</Label>
          <Input
            value={identity.middleName || ''}
            onChange={(e) => handleUpdate('middleName', e.target.value)}
            placeholder="Middle name (optional)"
            className="text-xs h-9"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-1">
          <Label className="text-xs font-semibold">Last / Family Name *</Label>
          <Input
            value={identity.lastName || ''}
            onChange={(e) => handleUpdate('lastName', e.target.value)}
            placeholder="Legal family name"
            className="text-xs h-9"
          />
        </div>
      </div>

      {/* DOB & Gender */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Date of Birth *</Label>
          <Input
            type="date"
            value={identity.dateOfBirth ? new Date(identity.dateOfBirth).toISOString().split('T')[0] : ''}
            onChange={(e) => handleUpdate('dateOfBirth', e.target.value ? new Date(e.target.value) : undefined)}
            className="text-xs h-9 bg-card"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Gender</Label>
          <Select
            value={identity.gender || 'prefer-not-to-say'}
            onValueChange={(val) => handleUpdate('gender', val)}
          >
            <SelectTrigger className="h-9 text-xs bg-card">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male" className="text-xs">Male</SelectItem>
              <SelectItem value="female" className="text-xs">Female</SelectItem>
              <SelectItem value="non-binary" className="text-xs">Non-binary</SelectItem>
              <SelectItem value="prefer-not-to-say" className="text-xs">Prefer not to say</SelectItem>
              <SelectItem value="other" className="text-xs">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Contact Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            Primary Email Address *
          </Label>
          <Input
            type="email"
            value={identity.email || ''}
            onChange={(e) => handleUpdate('email', e.target.value)}
            placeholder="applicant@example.com"
            className="text-xs h-9"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            Phone Number (with country code)
          </Label>
          <Input
            type="tel"
            value={identity.phone || ''}
            onChange={(e) => handleUpdate('phone', e.target.value)}
            placeholder="+61 400 000 000"
            className="text-xs h-9"
          />
        </div>
      </div>

      {/* Residential Address */}
      <div className="space-y-3 pt-2 border-t border-border">
        <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          Current Residential Address
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-3 space-y-1">
            <Input
              placeholder="Street address (e.g. 123 George St, Apt 4B)"
              value={identity.currentAddress?.street || ''}
              onChange={(e) => handleAddressUpdate('street', e.target.value)}
              className="text-xs h-9"
            />
          </div>
          <div className="space-y-1">
            <Input
              placeholder="City"
              value={identity.currentAddress?.city || ''}
              onChange={(e) => handleAddressUpdate('city', e.target.value)}
              className="text-xs h-9"
            />
          </div>
          <div className="space-y-1">
            <Input
              placeholder="State / Province"
              value={identity.currentAddress?.state || ''}
              onChange={(e) => handleAddressUpdate('state', e.target.value)}
              className="text-xs h-9"
            />
          </div>
          <div className="space-y-1">
            <Input
              placeholder="Country"
              value={identity.currentAddress?.country || ''}
              onChange={(e) => handleAddressUpdate('country', e.target.value)}
              className="text-xs h-9"
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-3 pt-2 border-t border-border">
        <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <HeartHandshake className="h-3.5 w-3.5 text-primary" />
          Emergency Contact Details
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Input
              placeholder="Contact Person Full Name"
              value={identity.emergencyContact?.name || ''}
              onChange={(e) => handleEmergencyUpdate('name', e.target.value)}
              className="text-xs h-9"
            />
          </div>
          <div className="space-y-1">
            <Input
              placeholder="Relationship (e.g. Parent, Sibling)"
              value={identity.emergencyContact?.relationship || ''}
              onChange={(e) => handleEmergencyUpdate('relationship', e.target.value)}
              className="text-xs h-9"
            />
          </div>
          <div className="space-y-1">
            <Input
              placeholder="Emergency Phone Number"
              value={identity.emergencyContact?.phone || ''}
              onChange={(e) => handleEmergencyUpdate('phone', e.target.value)}
              className="text-xs h-9"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
