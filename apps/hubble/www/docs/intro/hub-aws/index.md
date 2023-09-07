# Run Hubble on AWS EC2
![Placeholder](https://pin.ski/3RfuhMu)

## Intro
Setting up and running Hubble is easy, doesn't require any technical skills and usually takes less than 30 minutes of work and 2 hours of sync time.

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
### EC2 instance setup
Let's start by going AWS EC2 main dashboard. Our goal is to launch an instance, which can be done either from the main page or by going to the list of all instances.

Wherever you are, hit the "Launch instance" button.
![Placeholder](./images/aws-ec2-instances.png)
![Placeholder](./images/aws-ec2-instances-launch.png)

You will see the ec2 instance configuration menu.

Pick a name that you like.
![Placeholder](./images/ec2-setup-name.png)

In the **Application and OS Images** section, choose:
- Ubuntu Server 22.04 LTS (HVM)
- SSD Volume Type
- 64-bit (x86)
![Placeholder](./images/ec2-setup-ami.png)
In the **Instance type** section, select *m5.large*
![Placeholder](./images/ec2-setup-instance-type.png)

Now you will need a key pair to securely connect to your instance. Click *"Create new key pair"*...
![Placeholder](./images/ec2-setup-empty-keypair.png)

... and choose:
- RSA encryption type
- .pem file format

Be careful to save it in the right and safe place, since it will be necessary to enter the instance.
![Placeholder](./images/ec2-setup-create-key-pair.png)

After you created the new key pair, make sure that it's selected in the menu.
![Placeholder](./images/ec2-setup-key-pair-selected.png)

In the **Network settings** section, make sure to:
- *Allow SSH traffic*
- from *Anywhere*
![Placeholder](./images/ec2-setup-create-security-group.png)

In the **Network settings** section, increase the storage to **20 GiB**:
![Placeholder](./images/ec2-setup-storage.png)

This is everything that we need from the EC2 instance setup menu. Press **Launch instance** and wait a moment for AWS to process your request.

Once this is done, your instance will display in this list
![Placeholder](./images/ec2-instance-ready.png)

### Configure network permissions

To make sure that Hubble can talk to the rest of the network, we need to setup Inbound and Outbound traffic rules.

Click on **instance ID** from the previous menu, navigate to to **Security** tab.

![Placeholder](./images/ec2-instance-details.png)

Then, click on the name of your security group.

![Placeholder](./images/ec2-setup-sg.png)


From there, click **Edit inbound rules**...
![Placeholder](./images/ec2-security-group-details.png)

...and specify additional ports:
- 2283
- 2282
- 3000 (optional, if you want to [access the grafana dashboard from your computer](#access-grafana-in-your-browser))

Accept traffic from anywhere by selecting 0.0.0.0/0 option in the source.

![Placeholder](./images/ec2-security-group-inbound-edit.png)

Repeat the process for **outbound rules**.

Use the following ports:
- 2283
- 2282
- 443

again, leaving it open.

![Placeholder](./images/ec2-security-group-outbound-edit.png)

After you finished adding the new rules, this is how the menu should look like:

![Placeholder](./images/ec2-security-group-inbound-final.png)
![Placeholder](./images/ec2-security-group-outbound-final.png)

And we are done! Let's leave AWS dashboard and test the connection to your new machine.

### Connect to your instance
To connect to your ec2 instance, go to your terminal and find the key pair that you generated [earlier](#ec2-instance-setup).

```bash
ssh ubuntu@youripaddress -i your-keypair-filename.cer
```


![Placeholder](./images/ec2-connect.png)

## Install Hubble
We now have a machine that can run Hubble. Let's use it.

### Get alchemy keys
Before we start, we will need to access nodes from:
- Ethereum testnet goerli (todo: remove once tutorial migrates to 1.5.2)
- Ethereum mainnet
- Optimism mainnet

You can pick whatever provider you like (or run the nodes on your own), but for the sake of this tutorial, we will just use Alchemy.

Create 3 apps in their dashboard like this:
![Placeholder](./images/alchemy-setup.png)

End get their respective RPC endpoints like this:

![Placeholder](./images/alchemy-get-rpc.png)

We will use the endpoints in the next step.

### Run install script
Let's connect again to the EC2 instance and run the install script.

```bash
curl -sSL https://download.thehubble.xyz/bootstrap.sh | bash
```

After you execute it, the script will start downloading and setting up Hubble for you.
![Placeholder](./images/Hubble-install-script.png)

After some time, the script will ask you to provide the RPC endpoints that we got from Alchemy.
![Placeholder](./images/Hubble-rpc-prompt.png)

Once you correctly paste them, the script will resume building the hub.
![Placeholder](./images/Hubble-rpc-prompt-final.png)

After the download and build phase ends, Hubble will start syncing with other hubs in the network. It should take roughly 2 hours to get to the fully synced status.
![Placeholder](./images/Hubble-syncing-1.png)

Once the syncing ends, you will start seeing logs.

![Placeholder](./images/hubble-syncing-100.png)

**Congrats!** Now you're officially running a Farcaster hub.

You can safely close your terminal and proceed to monitor your hub's status via Grafana.

## Monitor Hubble
Since version x.x.x Hubble comes with a built-in Grafana dashboard that will help you monitor health and the sync status of your hub.

![Placeholder](./images/grafana-99.png)

### Access Grafana locally
TODO

### Access Grafana in your browser



To access Grafana from an external source (like your computer), you need to:

1. Allow traffic to port 3000 on your machine in as described [earlier](#configure-network-permissions).
2. Navigate to the public IP address of your instance with port :3000, like this: **x.x.x.x:3000**
3. Setup a login page with your credentials so nobody else can access the dashboard.

### Understand your Grafana dashboard

TODO 
![Placeholder](./images/grafana-1.png)
![Placeholder](./images/grafana-99.png)




## Appendix
### Upgrading Hubble
Upgrade Hubble to the latest version by running

```bash
cd ~/hubble && ./hubble.sh upgrade
```

### Troubleshooting
Contact us on Telegram
