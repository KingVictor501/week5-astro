/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import './demos.css';
import { titleCase } from '../../../lib/titleCase';

// A week of posts for a sample local bakery, previewed in a generic phone frame.
// The "photo" is a drawn color panel with the post's headline, not a stock image.

const WEEK = [
  { day: 'Mon', theme: 'Meet the team', art: 'Meet Maria, our 5 AM baker', caption: 'Maria has been rolling croissants here for six years. Say hi when you stop in this week!' },
  { day: 'Tue', theme: 'Tip Tuesday', art: 'Keep bread fresh 3x longer', caption: 'Skip the fridge. Wrap your loaf in a towel and keep it cut side down on the counter.' },
  { day: 'Wed', theme: 'Behind the scenes', art: 'Key lime filling, made from scratch', caption: 'A peek at Wednesday prep: 40 key lime tarts for the weekend crowd.' },
  { day: 'Thu', theme: 'Customer spotlight', art: '"Best Cuban bread in town"', caption: 'Thank you, Linda, for the kind words (shared with her permission)! See you Saturday.' },
  { day: 'Fri', theme: 'Weekend special', art: 'Saturday only: guava pastelitos', caption: 'Back by popular demand. Come early, they sold out by 10 last time.' },
  { day: 'Sat', theme: 'Local event', art: 'Find us at the Saturday market', caption: 'We are at the downtown market until noon with coffee cake and cold brew.' },
  { day: 'Sun', theme: 'Rest day', art: 'No post today', caption: 'Rest days are part of the plan. A steady rhythm beats posting every single day.' },
];

export default function PostWeekDemo() {
  const [day, setDay] = useState(0);
  const post = WEEK[day];

  return (
    <div class="demo">
      <div class="demo-head">
        <p class="demo-title">A Week of Posts for a Local Bakery</p>
        <span class="demo-tag">Illustrative example</span>
      </div>

      <div class="demo-seg" role="group" aria-label="Day of the week">
        {WEEK.map((d, i) => (
          <button type="button" aria-pressed={i === day} aria-label={`${d.day}: ${d.theme}`} onClick={() => setDay(i)}>
            {d.day}
          </button>
        ))}
      </div>

      <p class="week-theme" aria-live="polite">
        {post.day}: {titleCase(post.theme)}
      </p>

      <div class="week-phone">
        <div class="week-post-head">
          <span class="week-avatar" aria-hidden="true">
            S
          </span>
          <div>
            <p class="week-post-name">Sample Bakery</p>
            <p class="week-post-place">Dunedin, FL</p>
          </div>
        </div>
        <div class={`week-art week-art-${day} demo-reveal`} key={day} role="img" aria-label={`Post image: ${post.art}`}>
          {post.art}
        </div>
        <p class="week-caption">{post.caption}</p>
      </div>
      <p class="demo-note">A simple weekly rhythm with themes, planned and curated a month ahead.</p>
    </div>
  );
}
