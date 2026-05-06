'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cricosApi } from '@/lib/api/cricos.api';
import { Loader2, Search, Building2, BookOpen, MapPin, Network } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function RawDataPage() {
  const [activeTab, setActiveTab] = useState('institutions');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [providerCode, setProviderCode] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab, page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { q: search, providerCode, page, limit: 50 };
      let res;
      switch (activeTab) {
        case 'institutions': res = await cricosApi.getRawInstitutions(params); break;
        case 'courses': res = await cricosApi.getRawCourses(params); break;
        case 'locations': res = await cricosApi.getRawLocations(params); break;
        case 'course-locations': res = await cricosApi.getRawCourseLocations(params); break;
        default: res = { data: { data: [] } };
      }
      setData(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">Raw CRICOS Data</h1>
          <p className="text-muted-foreground text-sm mt-1">Official records imported from DataStore</p>
        </div>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
          <Input 
            placeholder="Provider Code..." 
            value={providerCode}
            onChange={(e) => setProviderCode(e.target.value.toUpperCase())}
            className="w-32 uppercase font-mono"
          />
          <Input 
            placeholder="Search keyword..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48"
          />
          <Button type="submit">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); }} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6">
          <TabsTrigger value="institutions" className="gap-2">
            <Building2 className="h-4 w-4" />
            Institutions
          </TabsTrigger>
          <TabsTrigger value="courses" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="locations" className="gap-2">
            <MapPin className="h-4 w-4" />
            Locations
          </TabsTrigger>
          <TabsTrigger value="course-locations" className="gap-2">
            <Network className="h-4 w-4" />
            Course Locations
          </TabsTrigger>
        </TabsList>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted/50 border-b">
                {activeTab === 'institutions' && (
                  <tr>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider">Provider Code</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider">Institution Name</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider">State</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider">Type</th>
                  </tr>
                )}
                {activeTab === 'courses' && (
                  <tr>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider">Provider Code</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider">Course Name</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider">Level</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider">Status</th>
                  </tr>
                )}
                {activeTab === 'locations' && (
                  <tr>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider">Provider Code</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider">Location Name</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider">State</th>
                  </tr>
                )}
                {activeTab === 'course-locations' && (
                  <tr>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider">Provider Code</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider">Course Code</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider">Location Name</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center">
                      <Loader2 className="animate-spin mx-auto text-primary h-8 w-8" />
                      <p className="text-sm text-muted-foreground mt-2">Loading raw data...</p>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-muted-foreground">
                      No records found
                    </td>
                  </tr>
                ) : data.map((item) => (
                  <tr key={item._id} className="hover:bg-muted/30 transition-colors text-sm">
                    {activeTab === 'institutions' && (
                      <>
                        <td className="p-4 font-mono font-medium">{item.cricosProviderCode}</td>
                        <td className="p-4">{item.institutionName}</td>
                        <td className="p-4">{item.postalAddressState}</td>
                        <td className="p-4">
                          <Badge variant="outline" className="text-[10px]">
                            {item.institutionType}
                          </Badge>
                        </td>
                      </>
                    )}
                    {activeTab === 'courses' && (
                      <>
                        <td className="p-4 font-mono font-medium">{item.cricosProviderCode}</td>
                        <td className="p-4 max-w-xs truncate" title={item.courseName}>{item.courseName}</td>
                        <td className="p-4 text-xs">{item.courseLevel}</td>
                        <td className="p-4">
                          <Badge variant={!item.expired ? 'default' : 'secondary'}>
                            {!item.expired ? 'Active' : 'Expired'}
                          </Badge>
                        </td>
                      </>
                    )}
                    {activeTab === 'locations' && (
                      <>
                        <td className="p-4 font-mono font-medium">{item.cricosProviderCode}</td>
                        <td className="p-4">{item.locationName}</td>
                        <td className="p-4">{item.state}</td>
                      </>
                    )}
                    {activeTab === 'course-locations' && (
                      <>
                        <td className="p-4 font-mono font-medium">{item.cricosProviderCode}</td>
                        <td className="p-4 font-mono">{item.cricosCourseCode}</td>
                        <td className="p-4">{item.locationName}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted-foreground">
            Showing page {page}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page === 1 || loading}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={loading || data.length < 50}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
