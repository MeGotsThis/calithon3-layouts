(function() {
  const recentDonations = nodecg.Replicant('recentDonations');
  const readDonations = nodecg.Replicant('readDonations');
  readDonations.setMaxListeners(nodecg.bundleConfig.donation.recent + 2);

  class GdqHostDashboardDonations extends Polymer.MutableData(Polymer.Element) {
    static get is() {
      return 'gdq-hostdash-donations';
    }

    static get properties() {
      return {
        prizes: {
          type: Array,
        },
      };
    }

    ready() {
      super.ready();
      recentDonations.on('change', (newVal) => {
        this.donations = newVal;
      });
    }

    markAllUnread() {
      if (readDonations.status !== 'declared') {
        return;
      }

      readDonations.value = [];
    }

    markAllRead() {
      if (readDonations.status !== 'declared') {
        return;
      }

      readDonations.value = this.donations.map((donation) => donation.id);
    }
  }

  customElements.define(GdqHostDashboardDonations.is,
    GdqHostDashboardDonations);
})();
