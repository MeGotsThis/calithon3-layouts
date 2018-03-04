(function() {
  const readDonations = nodecg.Replicant('readDonations');
  readDonations.setMaxListeners(nodecg.bundleConfig.donation.recent + 2);

  class GdqHostDashboardDonation extends Polymer.MutableData(Polymer.Element) {
    static get is() {
      return 'gdq-hostdash-donation';
    }

    static get properties() {
      return {
        donation: {
          type: Object,
        },
        read: {
          type: Boolean,
          computed: 'wasDonationRead(donation, readDonations)',
          reflectToAttribute: true,
        },
      };
    }

    ready() {
      super.ready();
      readDonations.on('change', (value) => {
        this.readDonations = value;
      });
    }

    wasDonationRead(donation, readDonations) {
      if (typeof donation === 'undefined'
          || typeof readDonations === 'undefined') {
        return false;
      }

      return readDonations.includes(donation.id);
    }

    toggleRead() {
      const donationIdx = this.readDonations.indexOf(this.donation.id);
      if (donationIdx < 0) {
        this.readDonations.push(this.donation.id);
      } else {
        this.readDonations.splice(donationIdx, 1);
      }
    }
  }

  customElements.define(GdqHostDashboardDonation.is, GdqHostDashboardDonation);
})();
