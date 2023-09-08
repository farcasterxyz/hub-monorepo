# Run Hubble on AWS EC2
![Final outcome, displaying a Grafana dashboard on AWS](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/Qmf1Yp7BTjhkYqLoLHjKfobjtBBkBVtWYYSRkfDa1XorPv)

## Intro
This is a step-by-step guide to setting up Hubble on AWS and monitoring it with Grafana.

Setting up and running Hubble is easy and doesn't require any technical skills.

It usually takes less than 30 minutes to complete the whole process.

By the end of this tutorial you will know how to:
- [Setup an AWS EC2 instance suitable for running Hubble](#set-up-aws-ec2)
- [Install and run Hubble](#install-hubble)
- [Use the built-in Grafana dashboard to monitor your hub](#monitor-hubble)
- [Keep your hub up to date and troubleshoot problems](#appendix)

### Requirements
- [AWS](https://aws.amazon.com/) account
- [Alchemy](https://www.alchemy.com/) account

### Costs
- AWS setup selected in this tutorial may cost up to $100/month
- Alchemy usage should stay within the free tier

## Set up AWS EC2
### Create and set up EC2 instance
Let's start by going to AWS EC2 main dashboard. Our goal is to launch an instance, which can be done either from the main page or by going to the list of all instances.

Wherever you are, hit the "Launch instance" button.
![Placeholder](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmPspHaUziz1ZGKhY1DgNQTMMbGZqVrmPbxRDQZtLkqGrx)
![Placeholder](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/Qmbcd1bzXHNxALUTq5fP9yMcPWQUYfUEgMKKSwrBHqdmMf)

You will get redirected to the EC2 instance configuration menu.

Pick a name for your instance, in our case it is `farcaster-hub-tutorial`
![Give your instance a name](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmcBLhfXxUWkssZooVbzd2PLUn1XTAg4SYj5Sf7NFdJ8Qx)

In the **Application and OS Images** section, choose:
- Ubuntu Server 22.04 LTS (HVM)
- SSD Volume Type
- 64-bit (x86)
![Select instance os images](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmR3qW7dbNQm77XBSTD5gV1xtyztU6TLtQG4fAxRBpRzaM)
In the **Instance type** section, select *m5.large*
![Select isntance type](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmUZnWD15jULjvvzXh42Y2GYvQX9B4sLAqpfXhKfX3iK2b)

Now you will need a key pair to securely connect to your instance.

Click *"Create new key pair"*...
![Empty key pair selection](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/Qmf5VQNo7p8aJvuwtVJUknAQWXVvfBZKhGkVkzjWpcmx2L)

... and choose:
- RSA encryption type
- .pem file format

Be careful to save it in the right and safe place, since it will be necessary to connect the instance.
![Create a key pair](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmR6h6yzkQZEd3YVkX12AAsZgDcij8sPxU9XHtKfv1yV5L)

After you created the new key pair, make sure that it's selected in the menu.
![Key pair selected](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmRhEhYJ11VdpfFRVCWDdQtuZvonFVmnC2ZHAufp13Jtfa)

In the **Network settings** section, make sure to *allow SSH traffic* from *Anywhere*.
![Allow SSH traffic](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmSCZMuVMhQzLZkHnTT3HZGvYiAgqF8x6hn8yiu4CiKT4S)

In the **Configure storage** section, increase the storage to **20 GiB**:
![Increase instance storage](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmPSsygfAG56uBfztnq2A2cLrHSPQe52QLYFvJfXdpMesA)

This is everything that we need from the EC2 instance setup menu.

Press **Launch instance** and wait a moment for AWS to process your request.

Once this is done, your instance will display in this list.
![Launch instance](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmcyNDrNrWo8ZXJEwwSEryKYDo9h2YF9BdQ7fjMzEtk1Us)

### Configure network permissions

To make sure that Hubble can talk to the rest of the network, we need to setup Inbound and Outbound traffic rules.

Click on **instance ID** from the previous menu, navigate to to **Security** tab.

![Dsiplay instance details](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmVKbod4TR4Q5dSgSYNhm5fjw7QYCKXyAG8FGSfqmdDeye)

Then, click on the name of your security group.

![Click on security group name](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmRLrvnkeG4URGTdjKvY2pGKNq5WhxFEbi36B1G2XYkAgJ)


From there, click **Edit inbound rules**...
![Click on edit inbound rules](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/Qmf7eawCoZjnxfiPwGs2V657jRqCuxP8pZBKhpfcjEpMRq)

...and specify additional ports:
- 2283
- 2282

Accept traffic from anywhere by selecting 0.0.0.0/0 option in the source.

![Edit inbound rules](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmPd3Sqni2Tfs6eTKTrFQNQW9F1WGv33QHmNx7G8JmjT83)

Repeat the process for **outbound rules**.

Use the following ports:
- 2283
- 2282
- 443

again, leaving them accessible from anywhere.

![Edit outbound rules](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmZkTQXbd9JaziNRCXjgbWAqJfiLfbq4ssNfDTuYbpwAVo)

After you finished adding the new rules, this is how the menu should look like:

![Final inbound rules](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmXodGxTSsiwfuzG9ggsxG6AD9NUWp9cLxXFp1HDMepSRk)
![Final outbound rules](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmSZ3ieuXjK3HWC63XCUvBzBfSr3rMSSzQuenAwtbdyT48)

**And we are done!** Your EC2 instance is ready.

Let's leave AWS dashboard and test the connection to your new machine.

### Connect to your instance
To connect to your ec2 instance, go to your terminal and find the key pair that you generated [earlier](#ec2-instance-setup).

Furst, let's restrict permissions to the keys by running:

```bash
chmod 400 your-keypair-filename.cer
```

And connect to your instance with

```bash
ssh ubuntu@youripaddress -i your-keypair-filename.cer
```


![Connect to EC2](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmSESoCoh3jnyU1URCSGsptix4UYq9SQmgfoyQkHnRoVVM)

## Install Hubble
We now have a machine that can run Hubble. Let's use it.

### Get alchemy keys
Before we start, we will need to access RPC endpoints from Ethereum and Optimism.

You can pick whatever provider you like (or run the nodes on your own), but for the sake of this tutorial, we will just use Alchemy.

Create 3 apps in their dashboard like this:
![Setup Alchemy](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmVR8cWmok9SaMLkb67rrpzG3JXyru8Xd3WGdhXBhH2Cxe)

End get their respective RPC endpoints like this:

![Get RPC URL](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmVrVK3X1s7hrBJhmdciBy1fjU696NKSSkdAZQZpN3nYot)

We will use the endpoints in the next step.

### Run install script
Let's connect again to the EC2 instance and run the install script.

```bash
curl -sSL https://download.thehubble.xyz/bootstrap.sh | bash
```

After you execute it, the script will start downloading and setting up Hubble for you.
![Run install script](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmTTgZxUgae3sJdie3uAuXwufocHL5RwHPsfhL2Rkx26Hf)

After some time, the script will ask you to provide the RPC endpoints and your Farcaster username.
![Provide RPC URLs to the script](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/Qmc75HtwESNDcTCVEEL5vyv2pSA7b76uSLXQKib5UKMUUQ)

Once you correctly paste them, the script will resume building the hub.
![RPC URLs after the input](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmZFgXX3ZvrLCox353oFEZAyAj2ttCLeossozFTBdrgkuD)

After the download and build phase ends, Hubble will start syncing with other hubs in the network.

Since version 1.5.2, Hubble by default downloads data from a snapshot and the process usually takes less than 5 minutes.
![Hubble starting syncing](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmRsLdgcai2nwG4SUsbvhk1GcuFrPFLg85PqMgVvDaCL8M)

Once the syncing ends, you will start receiving logs.

![Hubble synced](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmV3cr2dCvgWUJhSvnBDcD1Xk9trEzc3MkFPjqQZmtFGvH)

**Congrats!** Now you're officially running a Farcaster hub.

You can safely close your terminal and proceed to monitor your hub's status via Grafana.

## Monitor Hubble
Hubble comes with a built-in Grafana dashboard that will help you monitor health and the sync status of your hub.

![Grafana dashboard](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmeoS4UHAFspF5G1bsTGpiqh8BBGGE7xsZzGM8jzDUuLUG)

### Access Grafana
Grafana is running on port 3000 of your EC2 instance.

To access it in your browser you will have to setup port forwarding from your instance to your local machine like this:

```bash
ssh -L3000:localhost:3000 ubuntu@youripaddress -i farcaster-hub-tutorial-kp.cer
```

Once you ran this command, you should be able to access grafana easily at `localhost:3000`

### Understand your Grafana dashboard

Grafana contains all metrics and charts that you may need to monitor the health of your hub and the network.

Let's go over some of them

#### Status
![Grafana status metrics](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmZeHfEAqmmLE5D4YZd8o1kTLefsqW58KGhq9K4PB4cqdN)
**Message Sync** is a percantage of messages in your hub compared to last sync. It should be around 98-100%. If you are significantly below that, something may be wrong with your hub.

**Peers** is a number of known peers in your network that you may receive messages from. Occasionally you may sync with one of them.

**Blocks Processed** is a number of blocks that are being processed for Farcaster Contracts events. May shoot up if you are just starting your hub, but should be roughly between 1 and 3 every 10 seconds. If it stops you are not syncing with FC contracts and do not receive new FIDs.

**Farcaster Messages** is a total number of Farcaster messages stored in your hub. In general it should grow over time, but in may go down if many people decide to delete their content at once or they didn't pay for storage.


#### Sync metrics
![Grafana sync metrics](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmZF1aRnZ2HCrcfHdKnPwGfetYb5AAqEjG6LqegTW3jUuX)
**Incoming gossip** is a number of messages being gossiped to you over a given period of time.

**Inbound gossip connections** is a number of peers (other hubs) sending messages directly to you. You don't want this number to go to 0 as it will affect your peer score and network health.

**Gossip peers** is a number of inbound and outbound peers that you are connected with over a given period of time.

**Sync duration** — every couple of minutes your hub will perform a full sync with a peer. This metrics shows how long it took,

**Blocked peers** is a count of all peers who has been blocked by the network due to a bad peer reputation. For now it's usually 0.


#### Perf metrics
![Grafana perf metrics](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/Qmarf16LTn1j6gHbiLL9c82xpj8duvk259AFYpYnBjEfM3)
**Merge latency** is time needed to merge a newly received message into the Hub's DB. Generally should be within few milisecons. If it suddenly spikes up, it usually means that something is broken or you are running low on resources.

**Merge queue size** is a number of messages waiting to get merged. Sometimes spikes on a higher load, however if it spikes too often, it may mean that something is broken.

**Merkle Trie Queue Size** is number of messages waiting to be added to the merkle sync trie. Again, should stay flat and low.

**DB Size on disk** is the storage needed to store all the messages, should be proportional to the total message count.


## Appendix
### Upgrading Hubble
Upgrade Hubble to the latest version by running

```bash
cd ~/hubble && ./hubble.sh upgrade
```

The script will restart your hub and download the newest version.

### Troubleshooting
Contact us on [Telegram](https://t.me/farcasterdevchat)
