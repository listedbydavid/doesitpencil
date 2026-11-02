/* Tracking IDs for doesitpencil.org.
   Paste your IDs between the quotes, commit, and every page starts sending data.
   Leave a value blank ('') to turn that tracker off.

   googleTagId : Google Analytics 4 measurement ID (looks like G-XXXXXXXXXX)
                 or a Google Ads tag ID (looks like AW-XXXXXXXXXX).
                 To use both, list them: googleTagIds: ['G-XXXXXXXXXX','AW-XXXXXXXXXX']
   metaPixelId : Facebook / Meta Pixel ID (a long number, like 123456789012345)

   Events sent automatically:
     page view on every page
     join_community_click (Meta: Lead) when someone clicks any Skool link
     calculation_saved when someone saves a calculation
     report_download when someone downloads a PDF or JPG report */
window.DIP_TRACKING = {
  googleTagId: '',
  metaPixelId: ''
};
