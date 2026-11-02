/* Site settings for doesitpencil.org: tracking IDs and the Mailchimp signup.
   Paste values between the quotes, commit, and every page picks them up.
   Anything left blank ('') stays turned off.

   googleTagId : Google Analytics 4 measurement ID (G-XXXXXXXXXX) or Google Ads tag (AW-XXXXXXXXXX).
                 To use both: googleTagIds: ['G-XXXXXXXXXX','AW-XXXXXXXXXX']
   metaPixelId : Facebook / Meta Pixel ID (a long number)

   mailchimp.action : the form "action" URL from Mailchimp's embedded signup form.
                      Looks like https://xxxx.us21.list-manage.com/subscribe/post?u=...&id=...&f_id=...
                      While blank, the "Email me this deal" box stays hidden.
   mailchimp.*Field : merge tags you create in Mailchimp (Audience > Settings > Merge fields, type Text).

   Events sent automatically: page views, join_community_click (Meta: Lead), calculation_saved,
   share_deal, shared_deal_opened, email_signup, report_download. */
window.DIP_TRACKING = {
  googleTagId: '',
  metaPixelId: '',
  mailchimp: {
    action: '',
    calcField: 'CALC',
    summaryField: 'DEALSUM',
    linkField: 'DEALLINK'
  }
};
