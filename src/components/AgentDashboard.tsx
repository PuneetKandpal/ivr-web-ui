import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Device } from '@twilio/voice-sdk';
import io from 'socket.io-client';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PhoneCall, PhoneOff, Mic, MicOff, Pause, Play, Users, Clock, History, Phone } from "lucide-react";
import api, { twilioApi } from '@/services/api';
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const baseUrl = "https://concise-fox-needlessly.ngrok-free.app";
const socketUrl = `${baseUrl}`;

interface CallLog {
  id: string;
  type: 'incoming' | 'outgoing';
  caller: string;
  duration: number;
  timestamp: Date;
  status: 'completed' | 'missed' | 'failed';
}

const AgentDashboard = () => {
  const { agentId } = useParams();
  const [device, setDevice] = useState<any>(null);
  const [status, setStatus] = useState('Initializing...');
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [twilioIncomingCall, setTwilioIncomingCall] = useState<any>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState('');
  const [isOutboundCallInProgress, setIsOutboundCallInProgress] = useState(false);
  const socketRef = useRef<any>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('Setting up Socket.io connection for agent:', agentId);
    
    // Create socket connection
    socketRef.current = io(socketUrl, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling'],
        withCredentials: true,
        extraHeaders: {
          "ngrok-skip-browser-warning": "true"
        }
      });

    // Connection event handlers
    socketRef.current.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsSocketConnected(true);
      if (agentId) {
        socketRef.current.emit('joinRoom', agentId);
      }
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsSocketConnected(false);
    });

    socketRef.current.on('connect_error', (error: any) => {
      console.error('Socket connection error:', error);
      setStatus('Connection Error');
    });

    socketRef.current.on('reconnect', (attemptNumber: number) => {
      console.log('Reconnected to WebSocket server after', attemptNumber, 'attempts');
      if (agentId) {
        socketRef.current.emit('joinRoom', agentId);
      }
    });

    socketRef.current.on('newSupportCall', (data: any) => {
      console.log('Received new support call:', data);
      setIncomingCall(data);
    });

    socketRef.current.on('assignedCall', (data: any) => {
      console.log('Received assigned call:', data);
      setIncomingCall(data);
    });

    // Initialize Twilio Device
    const initDevice = async () => {
      console.log('Initializing Twilio device...');
      try {
        console.log('Fetching Twilio token...');
        const response = await twilioApi.getToken(agentId || '');
        const { token } = response.data;
        console.log("token-----", token);


        const twilioDevice = new Device(token);
        
        // Set up event listeners before registration
        twilioDevice.on("registered", () => {
            console.log("Twilio device registered successfully");
            setStatus('Ready');
        });

        twilioDevice.on("error", (error: any) => {
            console.error("Twilio device error:", error);
            setStatus('Error');
        });

        twilioDevice.on("disconnected", () => {
            console.log("Twilio device disconnected");
            setStatus('Disconnected');
        });

        twilioDevice.on("incoming", (call) => {
            console.log("Twilio device incoming call ---", call);
            setTwilioIncomingCall(call);
        });

        twilioDevice.on("outgoing", (call: any) => {
            console.log("Twilio device outgoing call ---", call);
        });

        // Register the device
        try {
            console.log('Attempting to register Twilio device...');
            await twilioDevice.register();
            console.log('Device registration initiated');
            setDevice(twilioDevice);
        } catch (error) {
            console.error('Error during device registration:', error);
            setStatus('Error');
        }

      } catch (error) {
        setStatus('Error');
        console.error('Error initializing Twilio device:', error);
      }
    };

    initDevice();

    return () => {
      console.log('Cleaning up AgentDashboard...');
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (device) {
        console.log('Destroying Twilio device');
        device.destroy();
      }
    };
  }, []);

  const handleJoinCall = async (conferenceName: string) => {
    console.log('Attempting to join conference:', conferenceName);
    try {
      if (device) {


        console.log('Connecting to conference with device');
        const response = await device.connect({ 
          params: {
            conferenceName: conferenceName,
            startConferenceOnEnter: true // Join as a moderator
          }
        });
        
        // Add error handlers for the call
        response.on('error', (error: any) => {
          console.error('Call error:', error);
          setStatus('Error');
        });
        
        response.on('disconnect', () => {
          console.log('Call disconnected');
          setStatus('Ready');
        });

        console.log('Successfully connected to conference');
        setStatus('In Call');
        setIncomingCall(null);
      } else {
        console.warn('Cannot join call: device not initialized');
        setStatus('Error');
      }
    } catch (error) {
      console.error('Error joining conference:', error);
      setStatus('Error');
      // Optionally show an error message to the user
    }
  };

  const handleHangup = () => {
    console.log('Attempting to hang up call');
    if (device) {
      console.log('Disconnecting all calls');
      device.disconnectAll();
      setStatus('Ready');
      setIsMuted(false);
      setIsOnHold(false);
      setTwilioIncomingCall(null);
      stopCallTimer();
      console.log('Call ended, status set to Ready');
    } else {
      console.warn('Cannot hang up: device not initialized');
    }
  };

  const handleAcceptTwilioCall = () => {
    if (twilioIncomingCall) {
      twilioIncomingCall.accept();
      setStatus('In Call');
      startCallTimer();
      setTwilioIncomingCall(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Ready':
        return 'default';
      case 'In Call':
        return 'secondary';
      case 'Error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const startCallTimer = () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    setCallDuration(0);
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  };

  const handleMuteToggle = () => {
    if (device && device.activeConnection()) {
      const connection = device.activeConnection();
      if (isMuted) {
        connection.mute(false);
      } else {
        connection.mute(true);
      }
      setIsMuted(!isMuted);
    }
  };

  const handleHoldToggle = () => {
    if (device && device.activeConnection()) {
      const connection = device.activeConnection();
      if (isOnHold) {
        connection.unhold();
      } else {
        connection.hold();
      }
      setIsOnHold(!isOnHold);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const addCallLog = (log: CallLog) => {
    setCallLogs(prev => [log, ...prev].slice(0, 10)); // Keep last 10 calls
  };

  const handleOutboundCall = async () => {
    if (!customerPhoneNumber) {
      toast.error("Please enter a customer phone number");
      return;
    }

    try {
      setStatus('Initiating call...');
      setIsOutboundCallInProgress(true);

      
      const response = await twilioApi.makeOutboundCall(agentId || '', customerPhoneNumber);
      console.log('Outbound call response:', response);


      // Add to call logs
      addCallLog({
        id: Date.now().toString(), // Using timestamp as temporary ID
        type: 'outgoing',
        caller: customerPhoneNumber,
        duration: 0,
        timestamp: new Date(),
        status: 'completed'
      });

      setStatus('In Call');
      startCallTimer();
      
      // Reset the phone number input
      setCustomerPhoneNumber('');
    } catch (error: any) {
      console.error('Error making outbound call:', error);
      toast.error(error.message || "Failed to make outbound call");
      setStatus('Ready');
      setIsOutboundCallInProgress(false);
    }
  };



  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Agent Dashboard</span>
                <div className="flex items-center gap-2">
                  <Badge variant={isSocketConnected ? 'default' : 'destructive'}>
                    {isSocketConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                  <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Outbound Call Section */}
              {status !== 'In Call' && (
                <div className="mb-6 p-4 bg-secondary/10 rounded-lg">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerPhone">Customer Phone Number</Label>
                      <div className="flex gap-2">
                        <Input
                          id="customerPhone"
                          placeholder="+1234567890"
                          value={customerPhoneNumber}
                          onChange={(e) => setCustomerPhoneNumber(e.target.value)}
                          disabled={isOutboundCallInProgress}
                        />
                        <Button
                          onClick={handleOutboundCall}
                          disabled={isOutboundCallInProgress || !customerPhoneNumber}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Existing In-Call Controls */}
              {status === 'In Call' && (
                <div className="mb-6 p-4 bg-secondary/10 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">{formatDuration(callDuration)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={isMuted ? "destructive" : "outline"}
                        size="icon"
                        onClick={handleMuteToggle}
                      >
                        {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant={isOnHold ? "destructive" : "outline"}
                        size="icon"
                        onClick={handleHoldToggle}
                      >
                        {isOnHold ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className='bg-red-500'
                        onClick={handleHangup}
                      >
                        <PhoneOff className="h-4 w-4 text-white" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Existing Incoming Call Alerts */}
              {twilioIncomingCall && (
                <Alert className="mb-6 border-2 border-green-800 animate-pulse">
                  <AlertDescription>
                    <div className="flex items-center justify-between w-full">
                      <PhoneCall className="h-4 w-4" />
                      <span>Incoming Twilio call</span>
                      <Button 
                        onClick={handleAcceptTwilioCall}
                        variant="default"
                        className="ml-2 bg-green-500"
                      >
                        Accept Call
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {incomingCall && (
                <Alert className="mb-6">
                  <PhoneCall className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>Incoming call from {incomingCall.caller}</span>
                      <Button 
                        onClick={() => handleJoinCall(incomingCall.conferenceName)}
                        variant="default"
                        className="ml-2"
                      >
                        Accept Call
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span>Recent Calls</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {callLogs.length > 0 ? (
                  <div className="space-y-4">
                    {callLogs.map((log) => (
                      <div key={log.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{log.caller}</span>
                          <Badge variant={log.status === 'completed' ? 'default' : 'destructive'}>
                            {log.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{format(log.timestamp, 'MMM d, h:mm a')}</span>
                          <span>{formatDuration(log.duration)}</span>
                        </div>
                        <Separator className="my-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    No call history available
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard; 