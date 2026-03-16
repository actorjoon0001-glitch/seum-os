(function () {
  'use strict';

  var SUPABASE_URL = 'https://uqsswlunnpdhledmoarj.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_ed5WIi3RAGydRgA-85kXzw_zB0xwjtE';

  var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  window.seumSupabase = supabase;
})();
