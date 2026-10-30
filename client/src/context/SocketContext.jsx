import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const s = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => {
      setConnected(true);

      // Auto join user and clinic rooms if authenticated
      if (user?.id) {
        s.emit('join:user', user.id);
      }
      const cId = user?.clinicId?._id || user?.clinicId;
      if (cId) {
        s.emit('join:clinic', cId);
      }
    });

    s.on('disconnect', () => {
      setConnected(false);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext) || { socket: null, connected: false };
};
