export type RcunNewsArticle = {
  slug: string
  title: string
  date: string
  author: string
  category: string
  excerpt: string
  content: string[]
  imageUrl?: string
  readTime?: string
}

export const RCUN_NEWS: RcunNewsArticle[] = [
  {
    slug: 'holiday-charity-drive',
    title: 'Holiday Charity Drive: Community Impact Highlights',
    date: 'December 2023',
    author: 'Sarah Jenkins',
    category: 'Service',
    excerpt: 'A recap of our seasonal giving effort and how members and partners came together to support local families.',
    content: [
      'Each year, we focus on practical support for neighbors who need it most through targeted donations, volunteer coordination, and community partnerships.',
      'This update shares the goals of the drive, how members contributed, and the impact areas we prioritized.',
      'Our holiday drive collected over 500 toys, 200 warm clothing items, and enough non-perishable food to support 50 families.',
      'Special thanks to our corporate partners who provided matching donations and our volunteers.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    readTime: '6 min read'
  },
  {
    slug: 'new-board-members-elected',
    title: 'New Board Members Elected: Leadership for 2024',
    date: 'November 2023',
    author: 'Michael Chen',
    category: 'Leadership',
    excerpt: 'Introducing the incoming board and the priorities for the year ahead: service, fellowship, and professional development.',
    content: [
      'Our club is powered by members who step up to lead. This announcement welcomes the newly elected board.',
      'Want to get involved in leadership? We are always looking for members who want to build experience.',
      'The new board brings diverse professional backgrounds from tech, finance, healthcare, and non-profit sectors.',
      'Key focus areas for 2024 include expanding our mentorship program and launching sustainability projects.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    readTime: '4 min read'
  },
  {
    slug: 'un-youth-summit-highlights',
    title: 'UN Youth Summit: Highlights & Takeaways',
    date: 'November 2023',
    author: 'Jessica Wong',
    category: 'International',
    excerpt: 'Key themes, lessons, and reflections from youth-focused sessions on global issues and civic engagement.',
    content: [
      'Our members attend events that connect local action to global conversations, especially where youth leadership is centered.',
      'This recap summarizes the main themes we brought back to the club and how they influenced our project planning.',
      'The summit featured speakers from 50+ countries discussing climate action, digital equity, and sustainable development.',
      'We returned with actionable insights on how young professionals can drive meaningful change in their communities.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    readTime: '8 min read'
  },
  {
    slug: 'professional-development-workshop',
    title: 'Professional Development Workshop: Fall Edition',
    date: 'October 2023',
    author: 'David Ross',
    category: 'Professional',
    excerpt: 'Join industry leaders as we explore strategies for career advancement in the post-pandemic landscape.',
    content: [
      'Our monthly professional development workshops bring together Rotaractors with established professionals.',
      'This session focused on navigating career transitions, building personal brands, and leveraging digital tools.',
      'Guest speaker Maria Rodriguez, VP of Marketing at TechCorp, shared her journey from entry-level to executive leadership.',
      'Attendees participated in mock networking sessions and received personalized feedback on their profiles.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1551135049-8a33b5883817?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    readTime: '5 min read'
  },
  {
    slug: 'central-park-cleanup',
    title: 'Central Park Cleanup: Environmental Impact Day',
    date: 'October 2023',
    author: 'Emily Martinez',
    category: 'Social',
    excerpt: 'Volunteers gathered this Saturday to beautify the park, planting over 50 new shrubs and clearing pathways.',
    content: [
      'Environmental stewardship is one of our core focus areas, and our monthly park cleanup events make a tangible difference.',
      'This month, we partnered with the Central Park Conservancy to address specific restoration needs in the Sheep Meadow area.',
      'Over 30 volunteers contributed 4 hours each, resulting in 120 collective hours of community service.',
      'We removed 15 bags of litter, planted native flowers, and created new pathways to reduce soil erosion.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    readTime: '3 min read'
  },
  {
    slug: 'annual-gala-fundraiser',
    title: 'Annual Gala Raises Record $15,000 for Local Charities',
    date: 'September 2023',
    author: 'Amanda Taylor',
    category: 'Fundraising',
    excerpt: 'A night of celebration and giving back to our community partners. See the highlights from our most successful evening.',
    content: [
      'Our annual gala brought together 150 attendees including members, sponsors, and community leaders for an unforgettable evening.',
      'Funds raised will support three local organizations: NYC Food Bank, Youth Mentorship Alliance, and the Homeless Services Coalition.',
      'The evening featured a silent auction, live entertainment from local artists, and inspiring speeches from our charity partners.',
      'Special recognition goes to our platinum sponsors and the planning committee who worked tirelessly to make this event a success.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    readTime: '7 min read'
  },
]

export function getRcunNewsArticleBySlug(slug: string): RcunNewsArticle | undefined {
  return RCUN_NEWS.find((a) => a.slug === slug)
}