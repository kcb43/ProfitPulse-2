/**
 * Platform Connection Status Component
 * Shows connection status for each marketplace platform
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2, XCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { platformApi } from '@/api/listingApiClient';

const MARKETPLACES = [
  { id: 'mercari', name: 'Mercari', color: 'bg-orange-500' },
  { id: 'facebook', name: 'Facebook', color: 'bg-blue-600' },
];

export function PlatformConnectionStatus({ onConnectClick }) {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const status = await platformApi.getStatus();
      setPlatforms(status);
    } catch (error) {
      console.error('Error loading platform status:', error);
      toast({
        title: 'Error',
        description: 'Failed to load platform connection status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (platform) => {
    try {
      await platformApi.disconnect(platform);
      toast({
        title: 'Disconnected',
        description: `${platform} has been disconnected`,
      });
      loadStatus();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to disconnect platform',
        variant: 'destructive',
      });
    }
  };

  const getPlatformStatus = (platformId) => {
    const platform = platforms.find((p) => p.platform === platformId);
    return platform?.status === 'connected' ? 'connected' : 'disconnected';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading platform status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Platform Connections</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadStatus}
            className="h-7 w-7 p-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {MARKETPLACES.map((marketplace) => {
          const status = getPlatformStatus(marketplace.id);
          const isConnected = status === 'connected';

          return (
            <div
              key={marketplace.id}
              className="flex items-center justify-between p-2 rounded-md border"
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-sm font-medium capitalize">{marketplace.name}</span>
                <Badge
                  variant={isConnected ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {isConnected ? 'Connected' : 'Not Connected'}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnect(marketplace.id)}
                    className="h-7 text-xs"
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onConnectClick?.(marketplace.id)}
                    className="h-7 text-xs"
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground mt-2">
          Use the Chrome extension to connect platforms. Click "Connect" for instructions.
        </p>
      </CardContent>
    </Card>
  );
}


