export const connectToGameRoom = (pin: string) => {
  const ws = new WebSocket(`ws://${window.location.host}/ws/game/${pin}/`);

  ws.onopen = () => {
    console.log('Connected to game room', pin);
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received:', data);

    // Handle different types of broadcast messages (chat, lobby updates, etc.)
    // Example:
    if (data.type === 'chat') {
      // Update chat UI
    }
  };

  ws.onclose = () => {
    console.log('Disconnected from game room', pin);
  };

  return ws;
};
