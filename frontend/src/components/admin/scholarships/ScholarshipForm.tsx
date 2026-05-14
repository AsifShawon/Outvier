'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Scholarship, CreateScholarshipPayload, SourceLink } from '@/types/scholarship';
import { University } from '@/types/university';
import { adminScholarshipsApi } from '@/lib/api/scholarships.api';
import { universitiesApi } from '@/lib/api/universities.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Trash, Image as ImageIcon, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

interface Props {
  initialData?: Scholarship;
  isEdit?: boolean;
}

export function ScholarshipForm({ initialData, isEdit = false }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  
  const [formData, setFormData] = useState<CreateScholarshipPayload>({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    shortSummary: initialData?.shortSummary || '',
    description: initialData?.description || '',
    category: initialData?.category || 'scholarship',
    type: initialData?.type || '',
    imageUrl: initialData?.imageUrl || '',
    imageAlt: initialData?.imageAlt || '',
    linkedUniversity: (initialData?.linkedUniversity as University)?._id || (initialData?.linkedUniversity as string) || '',
    country: initialData?.country || 'Australia',
    state: initialData?.state || '',
    city: initialData?.city || '',
    deadlineDate: initialData?.deadlineDate ? new Date(initialData.deadlineDate).toISOString().split('T')[0] : '',
    openingDate: initialData?.openingDate ? new Date(initialData.openingDate).toISOString().split('T')[0] : '',
    applicationLink: initialData?.applicationLink || '',
    eligibility: initialData?.eligibility || '',
    benefits: initialData?.benefits || '',
    requiredDocuments: initialData?.requiredDocuments || '',
    applicationSteps: initialData?.applicationSteps || '',
    importantNotes: initialData?.importantNotes || '',
    contactEmail: initialData?.contactEmail || '',
    status: initialData?.status || 'draft',
    visibility: initialData?.visibility || 'public',
    featured: initialData?.featured || false,
    priorityOrder: initialData?.priorityOrder || 0,
    seoTitle: initialData?.seoTitle || '',
    seoDescription: initialData?.seoDescription || '',
  });

  const [sourceLinks, setSourceLinks] = useState<SourceLink[]>(
    initialData?.sourceLinks || [{ label: '', url: '', type: 'official' }]
  );

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const res = await universitiesApi.adminGetAll({ limit: 100 });
        if (res.data?.data) {
          setUniversities(res.data.data as any);
        }
      } catch (error) {
        console.error('Failed to fetch universities', error);
      }
    };
    fetchUniversities();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSourceLinkChange = (index: number, field: keyof SourceLink, value: string) => {
    const newLinks = [...sourceLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setSourceLinks(newLinks);
  };

  const addSourceLink = () => {
    setSourceLinks([...sourceLinks, { label: '', url: '', type: 'official' }]);
  };

  const removeSourceLink = (index: number) => {
    const newLinks = [...sourceLinks];
    newLinks.splice(index, 1);
    setSourceLinks(newLinks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const payload = {
        ...formData,
        sourceLinks: sourceLinks.filter(l => l.url && l.label),
      };

      if (!payload.linkedUniversity) {
        delete payload.linkedUniversity;
      }

      if (isEdit && initialData?._id) {
        await adminScholarshipsApi.updateScholarship(initialData._id, payload);
        toast.success('Scholarship updated successfully');
        router.push('/admin/scholarships');
      } else {
        await adminScholarshipsApi.createScholarship(payload);
        toast.success('Scholarship created successfully');
        router.push('/admin/scholarships');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save scholarship');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-20">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/admin/scholarships">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to List
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => handleSelectChange('status', 'draft')}>
            Save as Draft
          </Button>
          <Button type="submit" disabled={loading} className="bg-deep-green hover:bg-deep-green/90">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Scholarship'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Basic Info */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
              </div>
              
              <div>
                <Label htmlFor="slug">Slug (auto-generated if empty)</Label>
                <Input id="slug" name="slug" value={formData.slug} onChange={handleChange} />
              </div>

              <div>
                <Label htmlFor="shortSummary">Short Summary *</Label>
                <Textarea 
                  id="shortSummary" 
                  name="shortSummary" 
                  value={formData.shortSummary} 
                  onChange={handleChange} 
                  required 
                  rows={2} 
                />
              </div>

              <div>
                <Label htmlFor="description">Full Description *</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  required 
                  rows={6} 
                />
              </div>
            </div>
          </div>

          {/* Details & Eligibility */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Details & Requirements</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="eligibility">Eligibility Criteria</Label>
                <Textarea id="eligibility" name="eligibility" value={formData.eligibility} onChange={handleChange} rows={3} />
              </div>
              <div>
                <Label htmlFor="benefits">Benefits</Label>
                <Textarea id="benefits" name="benefits" value={formData.benefits} onChange={handleChange} rows={3} />
              </div>
              <div>
                <Label htmlFor="requiredDocuments">Required Documents</Label>
                <Textarea id="requiredDocuments" name="requiredDocuments" value={formData.requiredDocuments} onChange={handleChange} rows={3} />
              </div>
              <div>
                <Label htmlFor="applicationSteps">Application Steps</Label>
                <Textarea id="applicationSteps" name="applicationSteps" value={formData.applicationSteps} onChange={handleChange} rows={3} />
              </div>
              <div>
                <Label htmlFor="importantNotes">Important Notes</Label>
                <Textarea id="importantNotes" name="importantNotes" value={formData.importantNotes} onChange={handleChange} rows={2} />
              </div>
            </div>
          </div>

          {/* Links & Sources */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Source Links</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="applicationLink">Direct Application Link</Label>
                <Input id="applicationLink" name="applicationLink" value={formData.applicationLink} onChange={handleChange} placeholder="https://..." />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Label className="mb-2 block">Additional Sources</Label>
                {sourceLinks.map((link, index) => (
                  <div key={index} className="flex items-center gap-3 mb-3">
                    <Input 
                      placeholder="Label (e.g., Official PDF)" 
                      value={link.label} 
                      onChange={(e) => handleSourceLinkChange(index, 'label', e.target.value)} 
                      className="w-1/3"
                    />
                    <Input 
                      placeholder="URL" 
                      value={link.url} 
                      onChange={(e) => handleSourceLinkChange(index, 'url', e.target.value)} 
                      className="flex-1"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSourceLink(index)} className="text-red-500">
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addSourceLink} className="mt-2">
                  <Plus className="w-4 h-4 mr-2" /> Add Source Link
                </Button>
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          
          {/* Organization & Setup */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Setup</h2>
            
            <div className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(val) => handleSelectChange('status', val)}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="unpublished">Unpublished</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Visibility</Label>
                <Select value={formData.visibility} onValueChange={(val) => handleSelectChange('visibility', val)}>
                  <SelectTrigger><SelectValue placeholder="Visibility" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={(val) => handleSelectChange('category', val)}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scholarship">Scholarship</SelectItem>
                    <SelectItem value="grant">Grant</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="admission">Admission Support</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Linked University</Label>
                <Select value={formData.linkedUniversity as string} onValueChange={(val) => handleSelectChange('linkedUniversity', val)}>
                  <SelectTrigger><SelectValue placeholder="Select University..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {universities.map(u => (
                      <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Checkbox 
                  id="featured" 
                  checked={formData.featured} 
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: !!checked }))}
                />
                <Label htmlFor="featured" className="cursor-pointer">Mark as Featured</Label>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Dates</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="openingDate">Opening Date</Label>
                <Input type="date" id="openingDate" name="openingDate" value={formData.openingDate} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="deadlineDate">Deadline Date</Label>
                <Input type="date" id="deadlineDate" name="deadlineDate" value={formData.deadlineDate} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Media</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input id="imageUrl" name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="https://..." />
              </div>
              {formData.imageUrl && (
                <div className="mt-2 rounded-lg overflow-hidden border">
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-auto object-cover" />
                </div>
              )}
              <div>
                <Label htmlFor="imageAlt">Image Alt Text</Label>
                <Input id="imageAlt" name="imageAlt" value={formData.imageAlt} onChange={handleChange} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </form>
  );
}
