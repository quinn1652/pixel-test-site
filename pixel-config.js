// =============================================================================
// PIXEL TEST SITE — CONFIGURATION
// =============================================================================
//
// Controls which Facebook pixel ID is loaded across all test pages.
//
// Setup:
//   1. Create a Facebook pixel at business.facebook.com/events_manager
//   2. Set pixelId below to your own test pixel ID
//   3. Set dryRun: false to transmit live beacons
//
// While dryRun: true, all fbq() calls are logged to the browser console
// and no data is sent to Facebook.
//
// =============================================================================

window.PIXEL_CONFIG = {
  // Your Facebook test pixel ID — replace before testing
  pixelId: "1308318914571848",

  // fbevents.js URL. Swap for an archived version to test specific
  // fbevents.js behavior. Default loads the current version from Facebook CDN.
  fbeventsUrl: "https://connect.facebook.net/en_US/fbevents.js",

  // Set false (and set a real pixelId) to transmit live beacons
  dryRun: false,
};
/*
<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1308318914571848');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=1308318914571848&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->
*/
