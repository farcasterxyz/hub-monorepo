class FarcasterNode {
  public static instanceNames = ['Cook', 'Friar', 'Knight', 'Miller', 'Squire'] as const;

  name: InstanceName;
  peers?: NodeRegistry;

  constructor(message: InstanceName) {
    this.name = message;
    console.log(`${this.name} is starting`);
  }

  setPeers(peers: NodeRegistry): void {
    const registryCopy = new Map(peers);
    registryCopy.delete(this.name);
    this.peers = registryCopy;
  }

  ping(name: InstanceName): void {
    if (!this.peers) {
      console.log('No peers to ping');
      return;
    }

    console.log(this.name + ' pings ' + name);
    const targetNode = this.peers.get(name);
    targetNode?.pong(this.name);
  }

  pingAll(): void {
    if (!this.peers) {
      console.log('No peers to ping');
      return;
    }

    this.peers.forEach((_peer, name) => {
      this.ping(name);
    });
  }

  pong(from: string): void {
    console.log(this.name + ' pongs ' + from);
  }
}

export type InstanceName = typeof FarcasterNode.instanceNames[number];
export type NodeRegistry = Map<InstanceName, FarcasterNode>;

export default FarcasterNode;
