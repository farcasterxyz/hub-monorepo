# Run Hubble on AWS
![Final outcome, displaying a Grafana dashboard on AWS](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmZGStcArThRY1GL2HjqmwtS8jyjfe4SqMjdGuDwGALjHv)

## Intro
This is a step-by-step guide to setting up Hubble on AWS and monitoring it with Grafana. It usually takes less than 30 minutes to complete the whole process.

By the end of this tutorial you will know how to:
- [Setup an AWS EC2 instance suitable for running Hubble](#set-up-aws-ec2)
- [Install and run Hubble](#install-hubble)
- [Use the built-in Grafana dashboard to monitor your hub](#monitor-hubble)
- [Keep your hub up to date](#upgrading-hubble)

This tutorial uses Hubble version `1.5.2` and Farcaster protocol version `2023.08.23`.

### Requirements
- [AWS](https://aws.amazon.com/) account
- [Alchemy](https://www.alchemy.com/) account

### Costs
- AWS setup recommended in this tutorial may cost up to $100/month
- Alchemy usage should stay within the free tier

## Set up AWS EC2 instance
Let's start by going to the AWS EC2 main dashboard.

Once you are in, press the **Launch instance** button.
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
![Select instance type](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmUZnWD15jULjvvzXh42Y2GYvQX9B4sLAqpfXhKfX3iK2b)

Now you will need a key pair to securely connect to your instance.

Click *"Create new key pair"* and choose:
- RSA encryption type
- .pem file format

![Create a key pair](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmR6h6yzkQZEd3YVkX12AAsZgDcij8sPxU9XHtKfv1yV5L)

In the **Network settings** section, make sure to *allow SSH traffic* from *Anywhere*.
![Allow SSH traffic](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmSCZMuVMhQzLZkHnTT3HZGvYiAgqF8x6hn8yiu4CiKT4S)

In the **Configure storage** section, increase the storage to **20 GiB**:
![Increase instance storage](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmPSsygfAG56uBfztnq2A2cLrHSPQe52QLYFvJfXdpMesA)

Press **Launch instance** and wait a moment for AWS to process your request.

Once this is done, your instance will be displayed in this list.
![Launch instance](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmcyNDrNrWo8ZXJEwwSEryKYDo9h2YF9BdQ7fjMzEtk1Us)

To make sure that Hubble can talk to the rest of the network, we need to set up *Inbound* and *Outbound* traffic rules.

Click on **instance ID** from the previous menu, navigate to to **Security** tab, and click on the name of your security group.

![Click on security group name](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmRLrvnkeG4URGTdjKvY2pGKNq5WhxFEbi36B1G2XYkAgJ)


From there, click **Edit inbound rules**
![Click on edit inbound rules](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/Qmf7eawCoZjnxfiPwGs2V657jRqCuxP8pZBKhpfcjEpMRq)

Accept traffic from anywhere in the *Source* column from the following ports:
- 2283
- 2282

![Edit inbound rules](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmZkTQXbd9JaziNRCXjgbWAqJfiLfbq4ssNfDTuYbpwAVo)

Repeat the process for **outbound rules**, using the following ports:
- 2283
- 2282
- 443

Similarly, putting *Anywhere* in the *Destination* column.

![Edit outbound rules](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmPd3Sqni2Tfs6eTKTrFQNQW9F1WGv33QHmNx7G8JmjT83)

Let's leave the AWS dashboard and test the connection to your new machine.

### Connect to your instance
To connect to your EC2 instance, go to your terminal and find the key pair that you generated earlier.

First, let's restrict permissions to the keys by running:

```bash
chmod 400 your-keypair-filename.cer
```

Connect to your instance with:

```bash
ssh ubuntu@youripaddress -i your-keypair-filename.cer
```

Once everything works, you should be allowed to ssh into the machine like below

![Connect to EC2](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmSESoCoh3jnyU1URCSGsptix4UYq9SQmgfoyQkHnRoVVM)

## Install Hubble
We now have a machine that can run Hubble. Let's install it.

### Get Optimism and Ethereum RPC URLs
Since Farcaster identity contracts are running onchain, hubs need to have a connection to Ethereum mainnet and Optimism.

To get the URLs, you can use a provider like Infura, Alchemy, or Ankr. If you use Alchemy, your URLs should look something like this:

`https://opt-mainnet.g.alchemy.com/v2/abc123`

`https://eth-mainnet.g.alchemy.com/v2/abc123`

### Run install script
Let's connect again to the EC2 instance and run the install script.

```bash
curl -sSL https://download.thehubble.xyz/bootstrap.sh | bash
```

After some time, the script will ask you to provide the RPC endpoints and your Farcaster username.
![Provide RPC URLs to the script](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/Qmc75HtwESNDcTCVEEL5vyv2pSA7b76uSLXQKib5UKMUUQ)

Once you correctly provide all the information, the script will resume building the hub.
![RPC URLs after the input](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmZFgXX3ZvrLCox353oFEZAyAj2ttCLeossozFTBdrgkuD)

After the download and build phases end, Hubble will start syncing with other hubs in the network.

Since version `1.5.2`, Hubble by default downloads data from a snapshot, and the process usually takes less than 5 minutes.
![Hubble starting syncing](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmRsLdgcai2nwG4SUsbvhk1GcuFrPFLg85PqMgVvDaCL8M)

Once the syncing ends, you will start receiving logs.

![Hubble synced](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmV3cr2dCvgWUJhSvnBDcD1Xk9trEzc3MkFPjqQZmtFGvH)

**Congrats!** Now you're officially running a Farcaster hub.

You can safely close your terminal and proceed to monitor your hub's status via Grafana.

## Monitor Hubble
Hubble comes with a built-in Grafana dashboard that will help you monitor the health and the sync status of your hub.

Grafana is running on port `3000` of your EC2 instance.

To access it in your browser you will have to setup port forwarding from your instance to your local machine like this:

```bash
ssh -L3000:localhost:3000 ubuntu@youripaddress -i farcaster-hub-tutorial-kp.cer
```

Once you run this command, you should be able to access Grafana easily at `localhost:3000`

![Grafana dashboard](https://moccasin-worried-snake-754.mypinata.cloud/ipfs/QmeoS4UHAFspF5G1bsTGpiqh8BBGGE7xsZzGM8jzDUuLUG)

## Upgrading Hubble
Upgrade Hubble to the latest version by running

```bash
cd ~/hubble && ./hubble.sh upgrade
```

The script will restart your hub and download the newest version.

## Troubleshooting
Contact us on [Telegram](https://t.me/farcasterdevchat)
