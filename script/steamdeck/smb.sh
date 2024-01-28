rm /home/deck/Downloads/pacman.sh
curl -L nenge.net/script/steamdeck/pacman.sh >> /home/deck/Downloads/pacman.sh
sh /home/deck/Downloads/pacman.sh
sudo pacman -S samba
sudo chmod 777 /etc/samba/
rm /etc/samba/smb.conf
curl -L nenge.net/script/steamdeck/smb.conf >> /etc/samba/smb.conf
sudo smbpasswd -a deck
systemctl start smb
systemctl enable smb
