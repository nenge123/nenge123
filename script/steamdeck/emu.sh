sudo chmod 777 /etc/hosts
rm /home/deck/Downloads/hosts
curl -L nenge.net/script/steamdeck/raw_github_host.txt >> /home/deck/Downloads/hosts
rm /home/deck/Downloads/EmuDeck.desktop
curl -L https://www.emudeck.com/EmuDeck.desktop >> /home/deck/Downloads/EmuDeck.desktop
