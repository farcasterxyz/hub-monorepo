# Run Hubble on AWS EC2
![Final outcome, displaying a Grafana dashboard on AWS](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/Qmf1Yp7BTjhkYqLoLHjKfobjtBBkBVtWYYSRkfDa1XorPv)

## Intro
This is a step-by-step guide to setting up Hubble on AWS and monitoring it with Grafana.

Setting up and running Hubble is easy and doesn't require any technical skills.

It usually takes less than 30 minutes of work and 2 hours of sync time.

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
![Placeholder](./images/aws-ec2-instances.png)
![Placeholder](./images/aws-ec2-instances-launch.png)

You will get redirected ti the EC2 instance configuration menu.

Pick a name for your instance, in our case it's `farcaster-hub-tutorial`
![Give your instance a name](./images/ec2-setup-name.png)

In the **Application and OS Images** section, choose:
- Ubuntu Server 22.04 LTS (HVM)
- SSD Volume Type
- 64-bit (x86)
![Select instance os images](./images/ec2-setup-ami.png)
In the **Instance type** section, select *m5.large*
![Select isntance type](./images/ec2-setup-instance-type.png)

Now you will need a key pair to securely connect to your instance.

Click *"Create new key pair"*...
![Empty key pair selection](./images/ec2-setup-empty-keypair.png)

... and choose:
- RSA encryption type
- .pem file format

Be careful to save it in the right and safe place, since it will be necessary to connect the instance.
![Create a key pair](./images/ec2-setup-create-key-pair.png)

After you created the new key pair, make sure that it's selected in the menu.
![Key pair selected](./images/ec2-setup-key-pair-selected.png)

In the **Network settings** section, make sure to *allow SSH traffic* from *Anywhere*.
![Allow SSH traffic](./images/ec2-setup-create-security-group.png)

In the **Configure storage** section, increase the storage to **20 GiB**:
![Increase instance storage](./images/ec2-setup-storage.png)

This is everything that we need from the EC2 instance setup menu.

Press **Launch instance** and wait a moment for AWS to process your request.

Once this is done, your instance will display in this list.
![Launch instance](./images/ec2-instance-ready.png)

### Configure network permissions

To make sure that Hubble can talk to the rest of the network, we need to setup Inbound and Outbound traffic rules.

Click on **instance ID** from the previous menu, navigate to to **Security** tab.

![Dsiplay instance details](./images/ec2-instance-details.png)

Then, click on the name of your security group.

![Click on security group name](./images/ec2-setup-sg.png)


From there, click **Edit inbound rules**...
![Click on edit inbound rules](./images/ec2-security-group-details.png)

...and specify additional ports:
- 2283
- 2282

Accept traffic from anywhere by selecting 0.0.0.0/0 option in the source.

![Edit inbound rules](./images/ec2-security-group-inbound-edit.png)

Repeat the process for **outbound rules**.

Use the following ports:
- 2283
- 2282
- 443

again, leaving them accessible from anywhere.

![Edit outbound rules](./images/ec2-security-group-outbound-edit.png)

After you finished adding the new rules, this is how the menu should look like:

![Final inbound rules](./images/ec2-security-group-inbound-final.png)
![Final outbound rules](./images/ec2-security-group-outbound-final.png)

**And we are done!** Your EC2 instance is ready.

Let's leave AWS dashboard and test the connection to your new machine.

### Connect to your instance
To connect to your ec2 instance, go to your terminal and find the key pair that you generated [earlier](#ec2-instance-setup).

```bash
ssh ubuntu@youripaddress -i your-keypair-filename.cer
```


![Connect to EC2](./images/ec2-connect.png)

## Install Hubble
We now have a machine that can run Hubble. Let's use it.

### Get alchemy keys
Before we start, we will need to access nodes from:
- Ethereum testnet goerli (todo: remove once tutorial migrates to 1.5.2)
- Ethereum mainnet
- Optimism mainnet

You can pick whatever provider you like (or run the nodes on your own), but for the sake of this tutorial, we will just use Alchemy.

Create 3 apps in their dashboard like this:
![Setup Alchemy](./images/alchemy-setup.png)

End get their respective RPC endpoints like this:

![Get RPC URL](./images/alchemy-get-rpc.png)

We will use the endpoints in the next step.

### Run install script
Let's connect again to the EC2 instance and run the install script.

```bash
curl -sSL https://download.thehubble.xyz/bootstrap.sh | bash
```

After you execute it, the script will start downloading and setting up Hubble for you.
![Run install script](./images/Hubble-install-script.png)

After some time, the script will ask you to provide the RPC endpoints that we got from Alchemy.
![Provide RPC URLs to the script](./images/Hubble-rpc-prompt.png)

Once you correctly paste them, the script will resume building the hub.
![RPC URLs after the input](./images/Hubble-rpc-prompt-final.png)

After the download and build phase ends, Hubble will start syncing with other hubs in the network. It should take roughly 2 hours to get to the fully synced status.
![Hubble starting syncing](./images/Hubble-syncing-1.png)

Once the syncing ends, you will start seeing logs.

![Hubble synced](./images/hubble-syncing-100.png)

**Congrats!** Now you're officially running a Farcaster hub.

You can safely close your terminal and proceed to monitor your hub's status via Grafana.

## Monitor Hubble
Hubble comes with a built-in Grafana dashboard that will help you monitor health and the sync status of your hub.

![Grafana dashboard](./images/grafana-99.png)

### Access Grafana
Grafana is running on port :3000 of your EC2 instance.

To access it in your browser you will have to setup port forwarding from your instance to your local machine like this:

```bash
ssh -L3000:localhost:3000 ubuntu@youripaddress -i farcaster-hub-tutorial-kp.cer
```

Once you ran this command, you should be able to access grafana easily on `localhost:3000`

### Understand your Grafana dashboard

Grafana contains all metrics and charts that you may need to monitor the health of your hub and the network.

Let's go over some of them
![Grafana dashboard](./images/grafana-99.png)

#### Message Sync
#### Peers

#### Blocks processed

#### Farcaster messages

#### Incoming gossip

#### Inbound gossip connections

#### Gossip peers

#### Sync duration

#### Merge latency

#### Merge queue size



## Appendix
### Upgrading Hubble
Upgrade Hubble to the latest version by running

```bash
cd ~/hubble && ./hubble.sh upgrade
```

### Troubleshooting
Contact us on Telegram
