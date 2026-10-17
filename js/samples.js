/**
 * Built-in Sample Valgrind Reports
 * Embedded directly as strings to ensure 100% offline and file:/// protocol compatibility.
 */

export const SAMPLES = {
  memcheck: `<?xml version="1.0"?>
<valgrindoutput>
  <protocolversion>4</protocolversion>
  <protocoltool>memcheck</protocoltool>

  <preamble>
    <line>Memcheck, a memory error detector</line>
    <line>Copyright (C) 2002-2022, and GNU GPL'd, by Julian Seward et al.</line>
    <line>Using Valgrind-3.19.0 and LibVEX; rerun with -h for copyright info</line>
    <line>Command: ./order_service --config=production.json --workers=4</line>
  </preamble>

  <pid>48219</pid>
  <ppid>48100</ppid>
  <tool>memcheck</tool>

  <args>
    <vargv>
      <exe>/usr/bin/valgrind</exe>
      <arg>--xml=yes</arg>
      <arg>--xml-file=memcheck_sample.xml</arg>
      <arg>--leak-check=full</arg>
      <arg>--show-leak-kinds=all</arg>
      <arg>--track-origins=yes</arg>
    </vargv>
    <argv>
      <exe>./order_service</exe>
      <arg>--config=production.json</arg>
      <arg>--workers=4</arg>
    </argv>
  </args>

  <status>
    <state>RUNNING</state>
    <time>00:00:00:00.120 </time>
  </status>

  <!-- Error 1: Invalid Read (Instance 1) -->
  <error>
    <unique>0x0</unique>
    <tid>1</tid>
    <kind>InvalidRead</kind>
    <what>Invalid read of size 4</what>
    <stack>
      <frame>
        <ip>0x4012A3</ip>
        <obj>/opt/service/order_service</obj>
        <fn>OrderProcessor::validate_items(std::vector&lt;Item&gt; const&amp;)</fn>
        <dir>/home/developer/src/service</dir>
        <file>order_processor.cpp</file>
        <line>142</line>
      </frame>
      <frame>
        <ip>0x4018C1</ip>
        <obj>/opt/service/order_service</obj>
        <fn>OrderProcessor::process_request(Request const&amp;)</fn>
        <dir>/home/developer/src/service</dir>
        <file>order_processor.cpp</file>
        <line>88</line>
      </frame>
      <frame>
        <ip>0x402010</ip>
        <obj>/opt/service/order_service</obj>
        <fn>main</fn>
        <dir>/home/developer/src/service</dir>
        <file>main.cpp</file>
        <line>34</line>
      </frame>
    </stack>
    <auxwhat>Address 0x5a18344 is 4 bytes after a block of size 64 alloc'd</auxwhat>
    <stack>
      <frame>
        <ip>0x4C3877F</ip>
        <obj>/usr/lib/valgrind/vgpreload_memcheck-amd64-linux.so</obj>
        <fn>malloc</fn>
      </frame>
      <frame>
        <ip>0x401100</ip>
        <obj>/opt/service/order_service</obj>
        <fn>OrderProcessor::allocate_buffer()</fn>
        <dir>/home/developer/src/service</dir>
        <file>order_processor.cpp</file>
        <line>45</line>
      </frame>
      <frame>
        <ip>0x4018A5</ip>
        <obj>/opt/service/order_service</obj>
        <fn>OrderProcessor::process_request(Request const&amp;)</fn>
        <dir>/home/developer/src/service</dir>
        <file>order_processor.cpp</file>
        <line>82</line>
      </frame>
    </stack>
    <suppression>
      <rawtext>
{
   &lt;insert_a_suppression_name_here&gt;
   Memcheck:Addr4
   fun:_ZN14OrderProcessor14validate_itemsERKSt6vectorI4ItemSaIS1_EE
   fun:_ZN14OrderProcessor15process_requestERK7Request
   fun:main
}
      </rawtext>
    </suppression>
  </error>

  <!-- Error 2: Identical Invalid Read (Instance 2 - for testing deduplication) -->
  <error>
    <unique>0x1</unique>
    <tid>2</tid>
    <kind>InvalidRead</kind>
    <what>Invalid read of size 4</what>
    <stack>
      <frame>
        <ip>0x4012A3</ip>
        <obj>/opt/service/order_service</obj>
        <fn>OrderProcessor::validate_items(std::vector&lt;Item&gt; const&amp;)</fn>
        <dir>/home/developer/src/service</dir>
        <file>order_processor.cpp</file>
        <line>142</line>
      </frame>
      <frame>
        <ip>0x4018C1</ip>
        <obj>/opt/service/order_service</obj>
        <fn>OrderProcessor::process_request(Request const&amp;)</fn>
        <dir>/home/developer/src/service</dir>
        <file>order_processor.cpp</file>
        <line>88</line>
      </frame>
      <frame>
        <ip>0x402010</ip>
        <obj>/opt/service/order_service</obj>
        <fn>main</fn>
        <dir>/home/developer/src/service</dir>
        <file>main.cpp</file>
        <line>34</line>
      </frame>
    </stack>
  </error>

  <!-- Error 3: Identical Invalid Read (Instance 3 - for testing deduplication) -->
  <error>
    <unique>0x2</unique>
    <tid>3</tid>
    <kind>InvalidRead</kind>
    <what>Invalid read of size 4</what>
    <stack>
      <frame>
        <ip>0x4012A3</ip>
        <obj>/opt/service/order_service</obj>
        <fn>OrderProcessor::validate_items(std::vector&lt;Item&gt; const&amp;)</fn>
        <dir>/home/developer/src/service</dir>
        <file>order_processor.cpp</file>
        <line>142</line>
      </frame>
      <frame>
        <ip>0x4018C1</ip>
        <obj>/opt/service/order_service</obj>
        <fn>OrderProcessor::process_request(Request const&amp;)</fn>
        <dir>/home/developer/src/service</dir>
        <file>order_processor.cpp</file>
        <line>88</line>
      </frame>
      <frame>
        <ip>0x402010</ip>
        <obj>/opt/service/order_service</obj>
        <fn>main</fn>
        <dir>/home/developer/src/service</dir>
        <file>main.cpp</file>
        <line>34</line>
      </frame>
    </stack>
  </error>

  <!-- Error 4: Invalid Write -->
  <error>
    <unique>0x3</unique>
    <tid>1</tid>
    <kind>InvalidWrite</kind>
    <what>Invalid write of size 8</what>
    <stack>
      <frame>
        <ip>0x401F50</ip>
        <obj>/opt/service/order_service</obj>
        <fn>SessionManager::clear_session(unsigned long)</fn>
        <dir>/home/developer/src/session</dir>
        <file>session_mgr.cpp</file>
        <line>215</line>
      </frame>
      <frame>
        <ip>0x402120</ip>
        <obj>/opt/service/order_service</obj>
        <fn>main</fn>
        <dir>/home/developer/src/service</dir>
        <file>main.cpp</file>
        <line>50</line>
      </frame>
    </stack>
    <auxwhat>Address 0x0 is not stack'd, malloc'd or (recently) free'd</auxwhat>
  </error>

  <!-- Error 5: Uninitialized Value Condition -->
  <error>
    <unique>0x4</unique>
    <tid>1</tid>
    <kind>UninitCondition</kind>
    <what>Conditional jump or move depends on uninitialised value(s)</what>
    <stack>
      <frame>
        <ip>0x402480</ip>
        <obj>/opt/service/order_service</obj>
        <fn>ConfigParser::is_feature_enabled(std::string const&amp;)</fn>
        <dir>/home/developer/src/config</dir>
        <file>config_parser.cpp</file>
        <line>74</line>
      </frame>
      <frame>
        <ip>0x402005</ip>
        <obj>/opt/service/order_service</obj>
        <fn>main</fn>
        <dir>/home/developer/src/service</dir>
        <file>main.cpp</file>
        <line>22</line>
      </frame>
    </stack>
  </error>

  <!-- Error 6: Definitely Lost Leak -->
  <error>
    <unique>0x5</unique>
    <tid>1</tid>
    <kind>Leak_DefinitelyLost</kind>
    <xwhat>
      <text>2,048 bytes in 16 blocks are definitely lost in loss record 3 of 5</text>
      <leakedbytes>2048</leakedbytes>
      <leakedblocks>16</leakedblocks>
    </xwhat>
    <stack>
      <frame>
        <ip>0x4C38D9F</ip>
        <obj>/usr/lib/valgrind/vgpreload_memcheck-amd64-linux.so</obj>
        <fn>operator new(unsigned long)</fn>
      </frame>
      <frame>
        <ip>0x403120</ip>
        <obj>/opt/service/order_service</obj>
        <fn>DatabasePool::create_connection()</fn>
        <dir>/home/developer/src/db</dir>
        <file>db_pool.cpp</file>
        <line>92</line>
      </frame>
      <frame>
        <ip>0x4033F0</ip>
        <obj>/opt/service/order_service</obj>
        <fn>DatabasePool::initialize(int)</fn>
        <dir>/home/developer/src/db</dir>
        <file>db_pool.cpp</file>
        <line>40</line>
      </frame>
      <frame>
        <ip>0x401FA0</ip>
        <obj>/opt/service/order_service</obj>
        <fn>main</fn>
        <dir>/home/developer/src/service</dir>
        <file>main.cpp</file>
        <line>18</line>
      </frame>
    </stack>
  </error>

  <!-- Error 7: Still Reachable Leak -->
  <error>
    <unique>0x6</unique>
    <tid>1</tid>
    <kind>Leak_StillReachable</kind>
    <xwhat>
      <text>8,192 bytes in 1 blocks are still reachable in loss record 5 of 5</text>
      <leakedbytes>8192</leakedbytes>
      <leakedblocks>1</leakedblocks>
    </xwhat>
    <stack>
      <frame>
        <ip>0x4C3877F</ip>
        <obj>/usr/lib/valgrind/vgpreload_memcheck-amd64-linux.so</obj>
        <fn>malloc</fn>
      </frame>
      <frame>
        <ip>0x524810</ip>
        <obj>/usr/lib/x86_64-linux-gnu/libcrypto.so.3</obj>
        <fn>CRYPTO_malloc</fn>
      </frame>
      <frame>
        <ip>0x401FA0</ip>
        <obj>/opt/service/order_service</obj>
        <fn>main</fn>
        <dir>/home/developer/src/service</dir>
        <file>main.cpp</file>
        <line>12</line>
      </frame>
    </stack>
  </error>

  <status>
    <state>FINISHED</state>
    <time>00:00:00:03.890 </time>
  </status>
</valgrindoutput>`,

  helgrind: `<?xml version="1.0"?>
<valgrindoutput>
  <protocolversion>4</protocolversion>
  <protocoltool>helgrind</protocoltool>

  <preamble>
    <line>Helgrind, a data race detector</line>
    <line>Copyright (C) 2007-2022, and GNU GPL'd, by OpenWorks LLP et al.</line>
    <line>Using Valgrind-3.19.0 and LibVEX; rerun with -h for copyright info</line>
    <line>Command: ./thread_worker --threads=2</line>
  </preamble>

  <pid>51204</pid>
  <ppid>51100</ppid>
  <tool>helgrind</tool>

  <args>
    <vargv>
      <exe>/usr/bin/valgrind</exe>
      <arg>--tool=helgrind</arg>
      <arg>--xml=yes</arg>
      <arg>--xml-file=helgrind_sample.xml</arg>
    </vargv>
    <argv>
      <exe>./thread_worker</exe>
      <arg>--threads=2</arg>
    </argv>
  </args>

  <status>
    <state>RUNNING</state>
    <time>00:00:00:00.080 </time>
  </status>

  <error>
    <unique>0x0</unique>
    <tid>2</tid>
    <kind>PossibleDataRace</kind>
    <what>Possible data race during write of size 4 at 0x6020c0 by thread #2</what>
    <stack>
      <frame>
        <ip>0x401314</ip>
        <obj>/opt/service/thread_worker</obj>
        <fn>WorkerQueue::push(int)</fn>
        <dir>/home/developer/src/threading</dir>
        <file>worker_queue.cpp</file>
        <line>58</line>
      </frame>
      <frame>
        <ip>0x401490</ip>
        <obj>/opt/service/thread_worker</obj>
        <fn>producer_thread_func(void*)</fn>
        <dir>/home/developer/src/threading</dir>
        <file>main_threads.cpp</file>
        <line>30</line>
      </frame>
      <frame>
        <ip>0x4C37B15</ip>
        <obj>/usr/lib/valgrind/vgpreload_helgrind-amd64-linux.so</obj>
        <fn>mythread_wrapper</fn>
      </frame>
      <frame>
        <ip>0x4E49608</ip>
        <obj>/lib/x86_64-linux-gnu/libpthread-2.31.so</obj>
        <fn>start_thread</fn>
      </frame>
    </stack>
    <auxwhat>This conflicts with a previous read of size 4 by thread #1</auxwhat>
    <stack>
      <frame>
        <ip>0x401380</ip>
        <obj>/opt/service/thread_worker</obj>
        <fn>WorkerQueue::pop()</fn>
        <dir>/home/developer/src/threading</dir>
        <file>worker_queue.cpp</file>
        <line>72</line>
      </frame>
      <frame>
        <ip>0x401510</ip>
        <obj>/opt/service/thread_worker</obj>
        <fn>consumer_thread_func(void*)</fn>
        <dir>/home/developer/src/threading</dir>
        <file>main_threads.cpp</file>
        <line>45</line>
      </frame>
    </stack>
    <auxwhat>Location 0x6020c0 is 0 bytes inside global variable 'g_queue_head'</auxwhat>
  </error>

  <error>
    <unique>0x1</unique>
    <tid>1</tid>
    <kind>LockOrder</kind>
    <what>Lock order "0x602100 before 0x602140" violated</what>
    <stack>
      <frame>
        <ip>0x4C39120</ip>
        <obj>/usr/lib/valgrind/vgpreload_helgrind-amd64-linux.so</obj>
        <fn>pthread_mutex_lock</fn>
      </frame>
      <frame>
        <ip>0x401650</ip>
        <obj>/opt/service/thread_worker</obj>
        <fn>AccountManager::transfer(Account&amp;, Account&amp;, double)</fn>
        <dir>/home/developer/src/account</dir>
        <file>account_mgr.cpp</file>
        <line>112</line>
      </frame>
      <frame>
        <ip>0x401820</ip>
        <obj>/opt/service/thread_worker</obj>
        <fn>main</fn>
        <dir>/home/developer/src/threading</dir>
        <file>main_threads.cpp</file>
        <line>85</line>
      </frame>
    </stack>
    <auxwhat>Required order was established by earlier lock acquisition</auxwhat>
    <stack>
      <frame>
        <ip>0x4C39120</ip>
        <obj>/usr/lib/valgrind/vgpreload_helgrind-amd64-linux.so</obj>
        <fn>pthread_mutex_lock</fn>
      </frame>
      <frame>
        <ip>0x401620</ip>
        <obj>/opt/service/thread_worker</obj>
        <fn>AccountManager::transfer(Account&amp;, Account&amp;, double)</fn>
        <dir>/home/developer/src/account</dir>
        <file>account_mgr.cpp</file>
        <line>105</line>
      </frame>
    </stack>
  </error>

  <status>
    <state>FINISHED</state>
    <time>00:00:00:01.210 </time>
  </status>
</valgrindoutput>`
};
