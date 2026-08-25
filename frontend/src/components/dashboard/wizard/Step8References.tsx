'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Users, Plus, Trash2, Mail, Phone } from 'lucide-react';

interface Step8Props {
  data: any;
  onChange: (fields: Record<string, any>) => void;
}

const RELATIONSHIPS = [
  { value: 'professor', label: 'Professor / Lecturer' },
  { value: 'academic_supervisor', label: 'Academic / Thesis Supervisor' },
  { value: 'employer', label: 'Direct Manager / Supervisor' },
  { value: 'colleague', label: 'Professional Colleague' },
  { value: 'other', label: 'Other Referee' },
];

export function Step8References({ data, onChange }: Step8Props) {
  const references = data.references || [];

  const handleAddReferee = () => {
    const newRef = {
      id: `ref_${Date.now()}`,
      refereeName: '',
      designation: '',
      organization: '',
      relationship: 'professor',
      email: '',
      phone: '',
    };
    onChange({ references: [...references, newRef] });
  };

  const handleUpdateReferee = (index: number, field: string, value: any) => {
    const updated = [...references];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ references: updated });
  };

  const handleRemoveReferee = (index: number) => {
    const updated = references.filter((_: any, i: number) => i !== index);
    onChange({ references: updated });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="border-b border-border pb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Step 8: Academic & Professional References
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Provide contact details for academic or workplace referees who can verify your credentials.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleAddReferee}
          size="sm"
          variant="outline"
          className="text-xs gap-1.5 h-8 bg-card"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Referee
        </Button>
      </div>

      {references.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-border rounded-2xl">
          <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground">No referees added yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Most postgraduate admissions require 1-2 academic or employer recommendation contacts.
          </p>
          <Button
            type="button"
            onClick={handleAddReferee}
            size="sm"
            className="mt-4 text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Reference Contact
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {references.map((refItem: any, index: number) => (
            <div
              key={refItem.id || index}
              className="p-4 rounded-xl bg-card border border-border space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary">
                  Referee #{index + 1}
                </span>
                <Button
                  type="button"
                  onClick={() => handleRemoveReferee(index)}
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Referee Full Name *</Label>
                  <Input
                    placeholder="e.g. Dr. Jane Smith"
                    value={refItem.refereeName || ''}
                    onChange={(e) => handleUpdateReferee(index, 'refereeName', e.target.value)}
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Position / Title *</Label>
                  <Input
                    placeholder="e.g. Professor of Computer Science"
                    value={refItem.designation || ''}
                    onChange={(e) => handleUpdateReferee(index, 'designation', e.target.value)}
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Organization / University *</Label>
                  <Input
                    placeholder="e.g. Dhaka University"
                    value={refItem.organization || ''}
                    onChange={(e) => handleUpdateReferee(index, 'organization', e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Relationship *</Label>
                  <Select
                    value={refItem.relationship || 'professor'}
                    onValueChange={(val) => handleUpdateReferee(index, 'relationship', val)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue placeholder="Relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIPS.map((rel) => (
                        <SelectItem key={rel.value} value={rel.value} className="text-xs">
                          {rel.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    Official Email *
                  </Label>
                  <Input
                    type="email"
                    placeholder="referee@university.edu"
                    value={refItem.email || ''}
                    onChange={(e) => handleUpdateReferee(index, 'email', e.target.value)}
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    Phone Number
                  </Label>
                  <Input
                    type="tel"
                    placeholder="+880 1700 000000"
                    value={refItem.phone || ''}
                    onChange={(e) => handleUpdateReferee(index, 'phone', e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
