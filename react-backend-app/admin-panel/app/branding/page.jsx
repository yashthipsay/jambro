'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '../components/DashboardLayout'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { useUser } from '@auth0/nextjs-auth0/client'
import { useToast } from '@/hooks/use-toast'
import { Music, CheckCircle, Loader2 } from 'lucide-react'
import { ScrollArea } from '@radix-ui/react-scroll-area'

export default function BrandingPage() {
  const { user } = useUser()
  const { toast } = useToast()
  const [jamRoomId, setJamRoomId] = useState(null)
  const [spotifyUsername, setSpotifyUsername] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [spotifyProfile, setSpotifyProfile] = useState(null)
  const [albums, setAlbums] = useState([])

  useEffect(() => {
    const fetchJamRoomData = async () => {
      if (!user?.email) return
      try {
        const response = await fetch(`http://localhost:5000/api/jamrooms/email/${user.email}`)
        const data = await response.json()
        if (data.success) {
          setJamRoomId(data.data._id)
          if (data.data.ownerDetails.spotify?.isVerified) {
            setSpotifyProfile(data.data.ownerDetails.spotify)
          }
        }
      } catch (error) {
        console.error('Error:', error)
      }
    }
    fetchJamRoomData()
  }, [user])

  const handleVerification = async () => {
    if (!spotifyUsername) return

    setIsVerifying(true)
    try {
      const response = await fetch('http://localhost:5000/api/spotify/verify/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jamRoomId, spotifyUsername })
      })

      const data = await response.json()

      if (data.success) {
        setSpotifyProfile(data.profile)
        toast({
          title: 'Success',
          description: 'Spotify profile verified successfully'
        })
      } else {
        toast({
          title: 'Error',
          description: data.message,
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to verify profile',
        variant: 'destructive'
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const fetchArtistAlbums = async (artistId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/spotify/artist-albums/${artistId}`)
      const data = await response.json()
      if (data.success) {
        setAlbums(data.albums)
      }
    } catch (error) {
      console.error('Error fetching albums:', error)
    }
  }

  useEffect(() => {
    if (spotifyProfile?.username) {
      fetchArtistAlbums(spotifyProfile.username)
    }
  }, [spotifyProfile])

  return (
    <div className="flex-1 p-6 mt-16 pl-72 overflow-y-auto h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-audiowide text-[#7DF9FF] mb-6">Personal Branding</h1>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="overflow-hidden rounded-xl border border-[#7DF9FF]/20 bg-black/40 backdrop-blur-sm">
            <div className="p-8">
              {/* Show verification field if profile not verified */}
              {!spotifyProfile?.isVerified ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[#7DF9FF] mb-2">
                      Spotify Username
                    </label>
                    <div className="flex space-x-4">
                      <Input
                        value={spotifyUsername}
                        onChange={(e) => setSpotifyUsername(e.target.value)}
                        className="flex-1 bg-black/40 border-[#7DF9FF]/20 text-white placeholder-gray-400"
                        placeholder="Enter your Spotify username"
                      />
                      <Button
                        onClick={handleVerification}
                        disabled={isVerifying || !spotifyUsername}
                        className="bg-[#7DF9FF]/20 hover:bg-[#7DF9FF]/30 text-white"
                      >
                        {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify Profile'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="flex items-center space-x-3 text-[#7DF9FF]">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Verified Spotify Profile</span>
                  </div>
                  <div className="rounded-lg bg-[#7DF9FF]/5 p-6">
                    <div className="flex items-center space-x-6">
                      {spotifyProfile.images?.[0]?.url ? (
                        <img
                          src={spotifyProfile.images[0].url}
                          alt="Profile"
                          className="h-16 w-16 rounded-full"
                        />
                      ) : (
                        <Music className="h-16 w-16 text-[#7DF9FF]" />
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-[#7DF9FF]">
                          {spotifyProfile.displayName || spotifyProfile.username}
                        </h3>
                        <p className="text-[#7DF9FF]/60">{spotifyProfile.followers} followers</p>
                        <a
                          href={spotifyProfile.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-[#7DF9FF]/80 hover:text-[#7DF9FF] transition-colors"
                        >
                          View Profile →
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Render Albums in a linear, tabular scrollable format inside the same card */}
                  {albums.length > 0 && (
                    <div className="mt-8">
                      <h2 className="text-2xl font-bold text-[#7DF9FF] mb-4">Artist Albums</h2>
                      <ScrollArea className="max-h-[300px] overflow-y-auto">
                        <div className="pr-4 space-y-2">
                          {albums.map((album) => (
                            <motion.a
                              key={album.id}
                              href={album.external_urls.spotify}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-3 border-b border-[#7DF9FF]/20 hover:bg-[#7DF9FF]/5 transition-colors group"
                            >
                              <div className="flex items-center space-x-4">
                                {album.images[0]?.url ? (
                                  <img
                                    src={album.images[0].url}
                                    alt={album.name}
                                    className="h-12 w-12 object-cover rounded"
                                  />
                                ) : (
                                  <div className="h-12 w-12 flex items-center justify-center bg-[#7DF9FF]/5 rounded">
                                    <Music className="h-6 w-6 text-[#7DF9FF]/40" />
                                  </div>
                                )}
                                <div>
                                  <h4 className="font-medium text-[#7DF9FF] group-hover:text-white transition-colors">
                                    {album.name}
                                  </h4>
                                  <p className="text-sm text-[#7DF9FF]/60">
                                    {new Date(album.release_date).getFullYear()}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[#7DF9FF]/60 group-hover:text-[#7DF9FF] transition-colors">
                                View →
                              </span>
                            </motion.a>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}