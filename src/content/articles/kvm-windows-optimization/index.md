Running a Windows guest virtual machine on a Linux host is straightforward with standard type-2 hypervisors like VirtualBox, but those setups introduce noticeable overhead in CPU execution, disk I/O, and graphics latency.

Running applications on bare-metal KVM (Kernel-based Virtual Machine) achieves near-native performance. Unlocking that potential requires paravirtualized VirtIO drivers, Hyper-V enlightenments, and targeted guest OS optimizations.

## Prerequisites and host preparation

This guide covers configuration and performance tweaks using Virtual Machine Manager (`virt-manager`) on Linux hosts.

Ensure the virtualization stack is installed and running on your Linux host:

```bash "install-stack.sh"
sudo systemctl enable --now libvirtd.service
sudo systemctl status libvirtd.service
```

![Verifying the libvirtd service status on the Linux host](./images/01-libvirtd-status.webp)

Before creating virtual machines, add your user account to the relevant virtualization groups to avoid permission prompts:

```bash "user-groups.sh"
sudo usermod -aG libvirt $USER
sudo usermod -aG libvirt-qemu $USER
sudo usermod -aG kvm $USER
sudo usermod -aG input $USER
sudo usermod -aG disk $USER
```

Download the necessary installation media before proceeding:
- A clean Windows 10 or 11 installation ISO.
- The latest stable `virtio-win.iso` driver package from the official Fedora VirtIO repository.

## Virtual machine configuration

When creating the new virtual machine in Virtual Machine Manager, check **Customize configuration before install** on the final creation step.

![Selecting customize configuration before starting installation](./images/02-customize-configuration.webp)

### Storage bus configuration

In the customization window, navigate to your VM disk storage and change the **Disk bus** from `SATA` or `IDE` to `VirtIO`.

![Setting the VM disk bus to VirtIO](./images/03-virtio-disk-bus.webp)

> Dedicated storage drive passthrough offers the highest throughput if a spare physical NVMe or SATA drive is available. For file-backed storage, VirtIO with QCOW2 or raw images provides substantial I/O improvements over emulated SATA.

### Network and video devices

Change the Network Interface device model to `virtio` to enable paravirtualized network throughput and reduced host CPU overhead.

![Selecting VirtIO for the network device model](./images/04-virtio-nic-model.webp)

For video output without dedicated PCIe GPU passthrough, select `QXL` as the video model.

![Configuring QXL as the primary video model](./images/05-qxl-video-model.webp)

## Attaching VirtIO driver media

To load the storage driver during Windows setup, attach the driver ISO as a secondary CD-ROM device:

1. Click **Add Hardware** in the bottom-left corner.
2. Under **Storage**, select **Select or create custom storage** and click **Manage**.

![Adding custom storage hardware in virt-manager](./images/06-add-custom-storage.webp)

3. Locate the downloaded `virtio-win.iso` file.
4. Set the device type to **CDROM device** and the bus to `SATA` or `IDE`.

![Configuring virtio-win.iso as a secondary CD-ROM device](./images/07-cdrom-device-type.webp)

5. Click **Begin Installation** at the top left to boot the virtual machine.

![Applying customization and booting the VM installer](./images/08-begin-installation.webp)

## Windows setup and driver injection

When the Windows installer starts, select **Custom: Install Windows only (advanced)**.

![Selecting Custom Windows installation](./images/09-custom-install.webp)

The drive list will appear empty because Windows does not bundle VirtIO SCSI drivers natively. Click **Load driver**.

![Clicking Load driver in the storage partition menu](./images/10-load-drivers.webp)

Browse to the attached `virtio-win` CD-ROM drive and select the storage driver directory matching your target Windows architecture (for example, `viostor\w10\amd64`).

![Selecting the VirtIO storage driver for Windows 10](./images/11-select-virtio-driver.webp)

Once the driver loads, the virtual disk will appear immediately. Proceed with the standard partition creation and OS installation.

![Proceeding with Windows installation on the recognized VirtIO volume](./images/12-initial-windows-setup.webp)

## Guest tools and SPICE integration

After completing the initial Windows setup and reaching the desktop, open File Explorer and navigate to the mounted `virtio-win` CD drive.

![Opening the VirtIO CD-ROM drive in Windows File Explorer](./images/13-cd-drive-files.webp)

Execute `virtio-win-guest-tools.exe` to install all remaining paravirtualized drivers, including network (`NetKVM`), balloon memory management, and serial communication.

![Launching the virtio-win-guest-tools installer](./images/14-virtio-win-guest-tools.webp)

Accept the default selections and complete the driver package installation.

![Completing the VirtIO driver installation wizard](./images/15-virtio-driver-setup.webp)

### Installing SPICE guest tools

To enable dynamic display resizing, clipboard sharing, and smooth mouse pointer integration, download the latest `spice-guest-tools` package from the official SPICE repository.

![Accessing the SPICE download portal](./images/16-spice-space-download.webp)

Download and run the `spice-guest-tools` Windows installer package.

![Installing SPICE guest tools for desktop integration](./images/17-spice-guest-tools.webp)

## Hardware channels and hypervisor features

Shut down the guest to add management channels and hypervisor enlightenments.

### QEMU guest agent and watchdog

In `virt-manager`, add a new Channel device with the name `org.qemu.guest_agent.0`. This enables the host to perform clean ACPI shutdowns, query IP addresses, and freeze filesystems for consistent snapshots.

![Adding the QEMU guest agent channel device](./images/18-guest-agent-channel.webp)

Optionally, add a watchdog device (such as `i6300esb`) with the default `reset` action to automatically reboot the guest if the kernel hangs.

![Configuring a hardware watchdog device](./images/19-watchdog-hardware.webp)

### Hyper-V enlightenments configuration

Hyper-V enlightenments allow KVM to emulate Windows-specific hypervisor interfaces, reducing virtualization overhead and clock synchronization drift.

Enable direct XML editing in `virt-manager` preferences:

1. Open **Edit -> Preferences** from the main Virtual Machine Manager menu.

![Opening virt-manager preferences](./images/20-virt-manager-preferences.webp)

2. Check **Enable XML editing**.

![Enabling XML editing in preferences](./images/21-enable-xml-editing.webp)

3. Open the VM details, switch to the **XML** tab, and add the following `<hyperv>` block inside `<features>`:

```xml "hyperv-features.xml"
<features>
  <hyperv>
    <relaxed state='on'/>
    <vapic state='on'/>
    <spinlocks state='on' retries='8191'/>
    <vpindex state='on'/>
    <runtime state='on'/>
    <synic state='on'/>
    <stimer state='on'>
      <direct state='on'/>
    </stimer>
    <frequencies state='on'/>
  </hyperv>
</features>
```

![Adding Hyper-V enlightenments to the domain XML](./images/22-hyperv-enlightenments-xml.webp)

4. Add the `hypervclock` timer inside the `<clock>` section:

```xml "hyperv-clock.xml"
<clock offset='localtime'>
  <timer name='hypervclock' present='yes'/>
</clock>
```

![Adding the hypervclock timer to the XML clock configuration](./images/23-hypervclock-xml.webp)

## Operating system storage optimizations

Reclaim disk footprint and reduce host image inflation by tuning guest maintenance settings.

### Disable hibernation

Virtual machine state can be managed directly by KVM snapshots. Disabling Windows hibernation removes `hiberfil.sys`, immediately saving gigabytes of disk space:

```shell "disable-hibernation.bat"
powercfg -h off
```

![Disabling Windows hibernation using powercfg](./images/24-powercfg-hibernation.webp)

### Component store cleanup

Clean up superseded update packages using the Deployment Image Servicing and Management (DISM) tool in an elevated command prompt:

```shell "dism-cleanup.bat"
dism.exe /online /Cleanup-Image /StartComponentCleanup /ResetBase
```

![Running DISM component cleanup to reduce Windows footprint](./images/25-dism-cleanup.webp)

### Disk cleanup automation

Pre-configure Windows Disk Cleanup with all cleaning categories:

```shell "cleanmgr-config.bat"
cleanmgr /sageset:0
```

![Configuring automated Disk Cleanup options](./images/26-cleanmgr-sageset.webp)

Execute the cleanup pass:

```shell "cleanmgr-run.bat"
cleanmgr /sagerun:0
```

![Executing automated Disk Cleanup pass](./images/27-cleanmgr-sagerun.webp)

### Trim and drive optimization

Run the Windows Drive Optimizer. When running over VirtIO SCSI with discard support, Windows detects the volume as a thin-provisioned drive and issues TRIM commands back to the host filesystem:

```shell "defrag-trim.bat"
defrag C: /O
```

![Running drive optimization with TRIM discard support](./images/28-optimize-drives.webp)

## Operational review

With VirtIO drivers, Hyper-V enlightenments, and OS-level trimming applied, the Windows guest operates with low CPU baseline utilization, responsive graphics, and fast disk access.

![Final optimized Windows VM operating smoothly on Linux KVM](./images/29-system-preview.webp)

This architecture separates host resource management from guest execution, delivering a high-performance Windows environment suitable for development and productivity tasks directly on Linux.
